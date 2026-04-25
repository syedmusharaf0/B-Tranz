import os
import uuid
import tempfile
from langchain_core.tracers import LangChainTracer
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from dotenv import load_dotenv
import tempfile
from langsmith import Client
from langchain_core.callbacks.manager import CallbackManager
from langchain_core.tracers.langchain import LangChainTracer
import shutil

load_dotenv()

# ── FastAPI ──────────────────────────────────────────────────────────────────
app = FastAPI(title="Btranz RAG API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Embeddings ───────────────────────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": False},
)

# ── Pinecone ─────────────────────────────────────────────────────────────────
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "btranz-rag2"
NAMESPACE = "btranz-docs"

if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)

# ── Smart upload: only if namespace is empty ─────────────────────────────────
index = pc.Index(index_name)
ns_stats = index.describe_index_stats()
ns_vector_count = ns_stats.namespaces.get(NAMESPACE, {})
current_count = getattr(ns_vector_count, "vector_count", 0)

if current_count == 0:
    print("📄 Loading and uploading documents...")
    manual_docs = [
        Document(page_content="""bTranz Software Solutions is a leading IT service provider 
        specializing in Custom Software Development, Testing, Oracle Implementations, IoT, 
        Web & Mobile Apps development. Headquartered in Riyadh, KSA with offices in 
        Hyderabad, India and Ajman, UAE. The company has over a decade of experience and 
        is professionally managed by highly experienced technocrats."""),
        Document(page_content="""bTranz Mission: Empower businesses by delivering top-notch 
        ERP solutions and applications tailored to unique needs. Helping companies achieve 
        goals by developing, implementing, and managing cutting-edge technology that drives 
        efficiency and growth. Ensuring seamless digital transformation enabling clients to 
        scale with confidence and achieve long-term success."""),
        Document(page_content="""bTranz Vision: To be the world's most trusted technology 
        partner, empowering businesses with innovative, high-quality solutions delivered on 
        time and within budget. Through deep industry expertise, cutting-edge technology, 
        and best practices, driving sustained growth and success for clients."""),
        Document(page_content="""bTranz Oracle Services include: Oracle Fusion Cloud ERP 
        implementation, managed services, upgrades, integration, reporting, and custom 
        PaaS extensions. Modules covered: Financial Management, Human Capital Management, 
        Supply Chain Management, Project Portfolio Management, Procurement, Integration 
        Cloud, and OTBI-BI Publisher."""),
        Document(page_content="""bTranz Oracle E-Business Suite (EBS): Full lifecycle 
        support including implementation, customization, upgrades and ongoing maintenance. 
        OBIEE services for business intelligence, analytics, dashboards and reports. 
        VAT Compliance solutions for regional regulatory requirements. 
        E-Invoicing implementation and integration services."""),
        Document(page_content="""bTranz Web Development services: ASP .Net Development, 
        PHP Development, Java Web Development, Ruby on Rails Development, Python Web 
        Development, React Native Web Development, Node.js Web Development, Angular.js 
        Web Development, QA Testing, UI Web Development, MEAN Stack Web Development."""),
        Document(page_content="""bTranz Mobile App Development: iPhone App Development, 
        iPad App Development, Android App Development, Flutter App Development. 
        CMS Development services: WordPress Development, Drupal Development, Kentico Development."""),
        Document(page_content="""bTranz Core Services: Custom Software Development with 
        decades of experience. Application Testing covering performance, functioning, 
        integrations, security, and usability. IT Consulting bringing best IT experts 
        for Oracle and other technologies. Maintenance and Support for ERP systems."""),
        Document(page_content="""bTranz Go-To-Market Strategy: Software development 
        driven by agile certified experts. 95% employee satisfaction rate. Talent acquisition 
        from database of 100,000+ candidates — top 10% hired, 10% faster ramp-up than industry average."""),
        Document(page_content="""bTranz Head Office: #7, Building #7, Al Askan Towers, 
        Dabbab Street, Riyadh, Kingdom of Saudi Arabia. Phone: +966 530 852 139."""),
        Document(page_content="""bTranz Hyderabad Office: MCH #8-2-293/82/L/219/A, 
        MLA Colony, Banjara Hills, Road #12, Hyderabad-500034, India. 
        Landline: +91 40-46043349. Mobile: +91 812 545 8080."""),
        Document(page_content="""bTranz UAE Office: bTranz InfoTech FZE LLC. 
        BLA-BR3-197, AMC - Boulevard A Building, Ajman Media City, Ajman, UAE. 
        Phone: +971 523449610."""),
    ]
    vectorstore.add_documents(
        manual_docs,
        namespace=NAMESPACE,
        ids=[str(uuid.uuid4()) for _ in range(len(manual_docs))],
    )
    print(f"✅ Uploaded {len(manual_docs)} chunks to Pinecone")
else:
    print(f"✅ Pinecone already has {current_count} vectors — skipping upload")

# ── LLM ──────────────────────────────────────────────────────────────────────

tracer = LangChainTracer()
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.5,
    callbacks=[tracer]
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5, "namespace": NAMESPACE},
)

prompt = ChatPromptTemplate.from_template("""
You are **"B-Tranz AI Assistant"**, a professional, intelligent AI assistant designed to support users with both:

1. General queries (knowledge, guidance, explanations)
2. B-Tranz-specific information (services, company details, offerings)

You provide accurate, helpful, and user-friendly responses while maintaining a high-quality customer experience.

---

## CORE RESPONSIBILITIES:

- Assist users with general knowledge and problem-solving
- Provide accurate information about B-Tranz using the knowledge base
- Guide users clearly and professionally
- Adapt tone based on user intent (informative, helpful, concise)

---

## CONTEXT USAGE RULES:

- If the question is about **B-Tranz**, use ONLY the provided context
- If the answer is not found in context, respond:
  👉 "I couldn't find relevant information in the B-Tranz knowledge base."

- If the question is **general (not about B-Tranz)**:
  👉 Answer using your general knowledge

- Never hallucinate B-Tranz-specific details

---

## RESPONSE STYLE:

- Be professional, clear, and structured
- Use bullet points or steps when helpful
- Keep answers concise but informative
- Avoid unnecessary repetition
- Focus on improving user understanding and experience

---
## CHAT HISTORY:
{chat_history}                                      

## CONTEXT:
{context}

---

## USER QUESTION:
{input}

---

## FINAL ANSWER:
""")

document_chain = create_stuff_documents_chain(llm, prompt)
qa_chain = create_retrieval_chain(retriever, document_chain)



from collections import defaultdict
from langchain_classic.memory import ConversationBufferWindowMemory

session_memory = defaultdict(
    lambda: ConversationBufferWindowMemory(
        memory_key="chat_history",
        return_messages=True,
        k=5
    )
)
session_id = str(uuid.uuid4())





if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
# ── Models ───────────────────────────────────────────────────────────────────


class QueryRequest(BaseModel):
    question: str
    session_id: str | None = None

class QueryResponse(BaseModel):
    answer: str
    session_id: str | None = None


class UploadQueryRequest(BaseModel):
    question: str
    extracted_text: str 


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.post("/ask", response_model=QueryResponse)
async def ask(request: QueryRequest):

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # ✅ Get memory per session
        memory = session_memory[request.session_id]

        # ✅ Load history
        chat_history = memory.load_memory_variables({})["chat_history"]

        # ✅ Pass history to chain
        response = qa_chain.invoke({
            "input": request.question,
            "chat_history": chat_history
        })

        # ✅ Save conversation
        memory.save_context(
            {"input": request.question},
            {"output": response["answer"]}
        )

        return QueryResponse(
            answer=response["answer"],
            session_id=request.session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-and-ask", response_model=QueryResponse)
async def upload_and_ask(
    file: UploadFile = File(...),
    question: str = "Summarize this document"
):
    """
    Accept PDF, JPG, PNG uploads — extract text — answer question about it.
    """
    filename = file.filename.lower()
    content = await file.read()

    extracted_text = ""

    # ── PDF ──────────────────────────────────────────────────────────────────
    if filename.endswith(".pdf"):
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                extracted_text += page.extract_text() or ""
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF read error: {str(e)}")

    # ── IMAGE (JPG, PNG) ──────────────────────────────────────────────────────
    elif filename.endswith((".jpg", ".jpeg", ".png")):
        try:
            import pytesseract
            from PIL import Image
            import io
            image = Image.open(io.BytesIO(content))
            extracted_text = pytesseract.image_to_string(image)
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="pytesseract or Pillow not installed. Run: pip install pytesseract Pillow"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image read error: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG files are supported.")

    if not extracted_text.strip():
        extracted_text = "No readable text could be extracted from this file."

    # ── Ask LLM about the extracted text ─────────────────────────────────────
    upload_prompt = f"""
You are an AI Assistant. A user uploaded a document and asked a question about it or summarize explain help him to achieve what he want.

DOCUMENT CONTENT:
{extracted_text[:4000]}

USER QUESTION:
{question}

Answer the question based ONLY on the document content above. Be clear and structured.
"""
    try:
        from langchain_core.messages import HumanMessage
        response = llm.invoke([HumanMessage(content=upload_prompt)])
        return QueryResponse(answer=response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/voice-to-text")
async def voice_to_text(
    audio: UploadFile = File(...),
    session_id: str = "default"   # ✅ session support
):
    try:
        # ✅ Validate audio
        if not audio.content_type.startswith("audio"):
            raise HTTPException(status_code=400, detail="Invalid audio file")

        # ✅ Read audio
        audio_bytes = await audio.read()

        # ✅ Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # ✅ Whisper (Groq)
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
                response_format="text"
            )

        # ✅ Cleanup
        os.unlink(tmp_path)

        question = transcription.strip()

        if not question:
            return {
                "session_id": session_id,
                "answer": "Sorry, I couldn't understand audio"
            }

        print("🎤 User said:", question)

        # ─────────────────────────────────────────────
        # ✅ MEMORY HANDLING
        # ─────────────────────────────────────────────
        memory = session_memory[session_id]

        chat_history = memory.load_memory_variables({})["chat_history"]

        # ✅ RAG call with memory
        response = qa_chain.invoke({
            "input": question,
            "chat_history": chat_history
        })

        # ✅ Save conversation
        memory.save_context(
            {"input": question},
            {"output": response["answer"]}
        )

        return {
            "session_id": session_id,
            "transcript": question,
            "answer": response["answer"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health(): 
    return {"status": "ok"}