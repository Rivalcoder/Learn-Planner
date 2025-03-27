import requests

API_KEY = "AIzaSyBJgyCxUF39cWPQiXL3egcmaIDzDeGBKdo"
CX = "46ec7eb14ac1a40c3"
query = "Two Pointers using Java"

url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={API_KEY}&cx={CX}"

response = requests.get(url)
data = response.json()

# Debug: Print full response


if "items" in data:
    for i, item in enumerate(data["items"][:10]):
        print(f"{i+1}. {item['title']} - {item['link']}")
else:
    print("No results found or API error")
