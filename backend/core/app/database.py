import os

from pymongo import MongoClient

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)

db = client["mydatabase"]

users_collection = db["users"]
experimentos_collection = db["experimentos"]
