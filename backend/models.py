from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Session(Base):
    """
    One interview session = one resume + one job role.
    A user can have many sessions.
    """
    __tablename__ = "sessions"

    id          = Column(Integer, primary_key=True, index=True)
    job_role    = Column(String, nullable=False)
    resume_text = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    # One session has many questions
    questions = relationship("Question", back_populates="session")


class Question(Base):
    """
    Each question generated for a session.
    Linked back to the session it belongs to.
    """
    __tablename__ = "questions"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    text       = Column(Text, nullable=False)
    order_num  = Column(Integer)  # Q1, Q2, Q3...

    session = relationship("Session", back_populates="questions")
    answer  = relationship("Answer", back_populates="question", uselist=False)


class Answer(Base):
    """
    The user's answer to a specific question, along with the AI evaluation.
    """
    __tablename__ = "answers"

    id               = Column(Integer, primary_key=True, index=True)
    question_id      = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer      = Column(Text, nullable=False)
    score            = Column(Float)
    verdict          = Column(String)
    feedback         = Column(Text)
    missing_concepts = Column(Text)   # stored as comma-separated string
    ideal_answer_summary = Column(Text)
    communication_tip = Column(Text)
    follow_up_question = Column(Text)
    submitted_at     = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="answer")