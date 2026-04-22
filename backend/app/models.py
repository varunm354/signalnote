from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector
from .database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, index=True)
    chunk_index = Column(Integer)
    type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)