from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./interview.db")
engine = create_engine(DATABASE_URL)  # remove connect_args for postgres

# This creates a file called interview.db in your backend/ folder
# DATABASE_URL = "sqlite:///./interview.db"

# The engine is the actual connection to the DB
# engine = create_engine(
    # DATABASE_URL,
    # connect_args={"check_same_thread": False}  # needed for SQLite + FastAPI
# )

# SessionLocal is a factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class for all our table models
Base = declarative_base()


def get_db():
    """
    Dependency function — FastAPI calls this to get a DB session
    for each request, then closes it automatically when done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
