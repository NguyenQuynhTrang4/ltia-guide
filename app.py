from flask import Flask, render_template, request, jsonify
import json
import difflib
import unicodedata
import re

app = Flask(__name__)


def load_intents():
    with open("data/intents.json", "r", encoding="utf-8") as file:
        return json.load(file)

def load_flights():
    with open("data/flights.json", "r", encoding="utf-8") as file:
        return json.load(file)

def normalize_text(text):
    text = text.lower().strip()

    # Bỏ dấu tiếng Việt
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")

    # Đổi riêng chữ đ thành d
    text = text.replace("đ", "d")

    # Bỏ ký tự đặc biệt, chỉ giữ chữ, số và khoảng trắng
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)

    # Xóa khoảng trắng thừa
    text = re.sub(r"\s+", " ", text).strip()

    return text    


def find_best_answer(user_message, lang="vi"):
    intents = load_intents()
    user_message = normalize_text(user_message)

    best_score = 0
    best_answer = None

    for intent in intents["intents"]:
        for pattern in intent["patterns"]:
            score = difflib.SequenceMatcher(
                None,
                user_message,
                normalize_text(pattern)
            ).ratio()

            if score > best_score:
                best_score = score
                if lang == "en" and "response_en" in intent:
                    best_answer = intent["response_en"]
                else:
                    best_answer = intent["response"]

    if best_score >= 0.45:
        return best_answer

    return "Xin lỗi, hiện tại tôi chưa có thông tin chính xác cho câu hỏi này. Bạn có thể hỏi lại rõ hơn được không?"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    lang = data.get("lang", "vi")

    answer = find_best_answer(user_message, lang)

    return jsonify({
        "answer": answer
    })

@app.route("/flight-search", methods=["POST"])
def flight_search():
    data = request.get_json()
    flight_no = data.get("flight_no", "").upper().strip()

    flights_data = load_flights()

    for flight in flights_data["flights"]:
        if flight["flight_no"].upper() == flight_no:
            return jsonify({
                "found": True,
                "flight": flight
            })

    return jsonify({
        "found": False,
        "message": "Không tìm thấy chuyến bay. Bạn vui lòng kiểm tra lại mã chuyến bay."
    })

if __name__ == "__main__":
    app.run(debug=True)