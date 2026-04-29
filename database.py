from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["mydatabase"]

users_collection = db["users"]
experimentos_collection = db["experimentos"]