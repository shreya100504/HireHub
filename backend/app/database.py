# from sqlalchemy import create_engine
# from sqlalchemy.orm import declarative_base, sessionmaker

# from app.config import DATABASE_URL


# engine = create_engine(DATABASE_URL)


# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )


# Base = declarative_base()

# def get_db():
#     db = SessionLocal()

#     try:
#         yield db
#     finally:
#         db.close()


from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

# Support PostgreSQL URLs provided by cloud hosting platforms
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
