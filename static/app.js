async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user-message");
    function addTypingMessage() {
        const chatMessages = document.getElementById("chatMessages");

        const typingDiv = document.createElement("div");
        typingDiv.className = "bot-message typing-message";
        typingDiv.innerText = "Đang trả lời...";

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return typingDiv;
    }
    input.value = "";

    const typingDiv = addTypingMessage();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                lang: getCurrentLanguage()
            })
        });

        const data = await response.json();

        setTimeout(function () {
            typingDiv.remove();
            addMessage(data.answer, "bot-message");
        }, 600);

    } catch (error) {
        setTimeout(function () {
            typingDiv.remove();
            addMessage("Có lỗi xảy ra khi kết nối với máy chủ.", "bot-message");
        }, 600);
    }
}

function addMessage(text, className, save = true) {
    const chatMessages = document.getElementById("chatMessages");

    const messageDiv = document.createElement("div");
    messageDiv.className = className;
    messageDiv.innerText = text;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (save) {
        saveChatMessage(text, className);
    }
}

function saveChatMessage(text, className) {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    chatHistory.push({
        text: text,
        className: className
    });

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    chatHistory.forEach(function (message) {
        addMessage(message.text, message.className, false);
    });
}

document.getElementById("userInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function quickAsk(message) {
    const input = document.getElementById("userInput");
    input.value = message;
    sendMessage();
}

async function searchFlight() {
    const input = document.getElementById("flightInput");
    const resultBox = document.getElementById("flightResult");
    const flightSection = document.getElementById("flightSection");
    const flightNo = input.value.trim();

    if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
    }

    if (!flightNo) {
        resultBox.innerHTML = "<span class='text-danger'>Vui lòng nhập mã chuyến bay.</span>";
        return;
    }

    try {
        const response = await fetch("/flight-search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ flight_no: flightNo })
        });

        const data = await response.json();

        if (data.found) {
            const flight = data.flight;

            const lang = getCurrentLanguage();

            const labels = {
                vi: {
                    flightNo: "Mã chuyến bay",
                    airline: "Hãng bay",
                    route: "Tuyến bay",
                    time: "Giờ bay",
                    gate: "Cổng",
                    checkin: "Quầy check-in",
                    status: "Trạng thái"
                },
                en: {
                    flightNo: "Flight No.",
                    airline: "Airline",
                    route: "Route",
                    time: "Time",
                    gate: "Gate",
                    checkin: "Check-in Counter",
                    status: "Status"
                }
            };

            resultBox.innerHTML = `
                <div class="flight-card">
                    <div><strong>${labels[lang].flightNo}:</strong> ${flight.flight_no}</div>
                    <div><strong>${labels[lang].airline}:</strong> ${flight.airline}</div>
                    <div><strong>${labels[lang].route}:</strong> ${flight.route}</div>
                    <div><strong>${labels[lang].time}:</strong> ${flight.time}</div>
                    <div><strong>${labels[lang].gate}:</strong> ${flight.gate}</div>
                    <div><strong>${labels[lang].checkin}:</strong> ${flight.checkin_counter}</div>
                    <div><strong>${labels[lang].status}:</strong> ${translateFlightStatus(flight.status, lang)}</div>
                </div>
            `;

            flightSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else {
            resultBox.innerHTML = `<span class="text-danger">${data.message}</span>`;
            flightSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    } catch (error) {
        resultBox.innerHTML = "<span class='text-danger'>Có lỗi xảy ra khi tra cứu chuyến bay.</span>";
    }
}

document.getElementById("flightInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchFlight();
    }
});

function showMapInfo(title, description) {
    const mapInfo = document.getElementById("mapInfo");

    mapInfo.innerHTML = `
        <strong>${title}</strong><br>
        ${description}
    `;
}

function showProcess(type) {
    const processContent = document.getElementById("processContent");
    const lang = getCurrentLanguage();

    const processes = {
        vi: {
            domestic: `
                <strong>Quy trình bay nội địa</strong>
                <ol>
                    <li>Đến sân bay trước giờ bay khoảng 2 tiếng.</li>
                    <li>Tìm quầy check-in của hãng hàng không.</li>
                    <li>Làm thủ tục và gửi hành lý ký gửi nếu có.</li>
                    <li>Qua khu vực kiểm tra an ninh.</li>
                    <li>Đến đúng cổng chờ ghi trên thẻ lên máy bay.</li>
                    <li>Theo dõi thông báo và lên máy bay khi được gọi.</li>
                </ol>
            `,
            international: `
                <strong>Quy trình bay quốc tế</strong>
                <ol>
                    <li>Đến sân bay trước giờ bay khoảng 3 tiếng.</li>
                    <li>Làm thủ tục check-in và gửi hành lý.</li>
                    <li>Qua khu vực kiểm tra an ninh.</li>
                    <li>Làm thủ tục xuất cảnh.</li>
                    <li>Đến cổng chờ quốc tế.</li>
                    <li>Chuẩn bị hộ chiếu, visa nếu cần và lên máy bay.</li>
                </ol>
            `,
            firstTime: `
                <strong>Hướng dẫn người đi máy bay lần đầu</strong>
                <ol>
                    <li>Chuẩn bị giấy tờ tùy thân, vé máy bay hoặc mã đặt chỗ.</li>
                    <li>Đến sân bay sớm để có thời gian làm thủ tục.</li>
                    <li>Hỏi nhân viên sân bay nếu chưa biết quầy check-in ở đâu.</li>
                    <li>Không mang vật phẩm bị cấm trong hành lý xách tay.</li>
                    <li>Luôn kiểm tra màn hình thông tin chuyến bay.</li>
                    <li>Đến cổng chờ trước giờ lên máy bay.</li>
                </ol>
            `,
            baggage: `
                <strong>Quy định hành lý cơ bản</strong>
                <ol>
                    <li>Hành lý ký gửi được gửi tại quầy check-in của hãng bay.</li>
                    <li>Hành lý xách tay mang theo lên máy bay cần đúng kích thước và trọng lượng quy định.</li>
                    <li>Không mang dao, kéo, vật sắc nhọn hoặc chất dễ cháy trong hành lý xách tay.</li>
                    <li>Chất lỏng khi bay quốc tế thường cần tuân theo giới hạn dung tích.</li>
                    <li>Nếu thất lạc hành lý, hãy liên hệ quầy Lost & Found hoặc hãng hàng không.</li>
                </ol>
            `
        },
        en: {
            domestic: `
                <strong>Domestic flight process</strong>
                <ol>
                    <li>Arrive at the airport about 2 hours before departure.</li>
                    <li>Find your airline's check-in counter.</li>
                    <li>Complete check-in and drop off checked baggage if needed.</li>
                    <li>Go through the security check area.</li>
                    <li>Proceed to the gate shown on your boarding pass.</li>
                    <li>Follow announcements and board when called.</li>
                </ol>
            `,
            international: `
                <strong>International flight process</strong>
                <ol>
                    <li>Arrive at the airport about 3 hours before departure.</li>
                    <li>Complete check-in and drop off your baggage.</li>
                    <li>Go through security screening.</li>
                    <li>Complete immigration procedures.</li>
                    <li>Proceed to the international boarding gate.</li>
                    <li>Prepare your passport, visa if required, and board the aircraft.</li>
                </ol>
            `,
            firstTime: `
                <strong>Guide for first-time flyers</strong>
                <ol>
                    <li>Prepare your ID documents, ticket, or booking code.</li>
                    <li>Arrive early to have enough time for check-in.</li>
                    <li>Ask airport staff if you do not know where the check-in counter is.</li>
                    <li>Do not bring prohibited items in your carry-on baggage.</li>
                    <li>Always check the flight information screens.</li>
                    <li>Arrive at the boarding gate before boarding time.</li>
                </ol>
            `,
            baggage: `
                <strong>Basic baggage rules</strong>
                <ol>
                    <li>Checked baggage is dropped off at the airline check-in counter.</li>
                    <li>Carry-on baggage must meet the airline's size and weight limits.</li>
                    <li>Do not bring knives, scissors, sharp objects, or flammable items in carry-on baggage.</li>
                    <li>Liquids on international flights usually need to follow volume limits.</li>
                    <li>If your baggage is lost, contact Lost & Found or your airline.</li>
                </ol>
            `
        }
    };

    processContent.innerHTML = processes[lang][type];
}

window.addEventListener("load", function () {
    loadChatHistory();
});

function clearChatHistory() {
    localStorage.removeItem("chatHistory");

    const chatMessages = document.getElementById("chatMessages");
    const lang = getCurrentLanguage();

    const greeting = {
        vi: "Xin chào! Tôi có thể hỗ trợ bạn về check-in, hành lý, quy trình bay, phương tiện di chuyển và thông tin sân bay.",
        en: "Hello! I can help you with check-in, baggage, flight procedures, transportation, and airport information."
    };

    chatMessages.innerHTML = `
        <div class="bot-message">
            ${greeting[lang]}
        </div>
    `;
}

function updateCurrentTime() {
    const currentTime = document.getElementById("currentTime");

    if (!currentTime) return;

    const lang = localStorage.getItem("language") || "vi";
    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    if (lang === "vi") {
        currentTime.innerText = `Hôm nay: ${day}/${month}/${year} - ${hour}:${minute}:${second}`;
    }

    if (lang === "en") {
        currentTime.innerText = `Today: ${day}/${month}/${year} - ${hour}:${minute}:${second}`;
    }
}

updateCurrentTime();
setInterval(updateCurrentTime, 1000);

function setLanguage(lang) {
    localStorage.setItem("language", lang);

    function setText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        }
    }

    function setPlaceholder(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.placeholder = text;
        }
    }

    if (lang === "vi") {
        document.title = "Trợ lý Sân bay Quốc tế Long Thành";

        setText("appTitle", "Trợ lý Sân bay Quốc tế Long Thành");
        setText("appSubtitle", "Trợ lý ảo hỗ trợ hành khách tại Sân bay Quốc tế Long Thành");

        setText("navFlight", "Chuyến bay");
        setText("navMap", "Bản đồ");
        setText("navProcess", "Quy trình");
        setText("navChat", "Chatbot");

        setText("flightTitle", "Tra cứu chuyến bay");
        setText("flightHint", "Mã mẫu: VN123, VJ456, QH789");
        setPlaceholder("flightInput", "Nhập mã chuyến bay, ví dụ: VN123");
        setText("flightSearchBtn", "Tra cứu");

        setText("mapTitle", "Bản đồ sân bay đơn giản");
        setText("mapHint", "Sơ đồ minh họa các khu vực chính trong nhà ga.");
        setText("mapEntrance", "Sảnh vào");
        setText("mapCheckin", "Quầy check-in");
        setText("mapSecurity", "Kiểm tra an ninh");
        setText("mapImmigration", "Xuất nhập cảnh");
        setText("mapFood", "Khu ăn uống");
        setText("mapGateA", "Cổng chờ A");
        setText("mapGateB", "Cổng chờ B");
        setText("mapBaggage", "Nhận hành lý");
        setText("mapTransport", "Taxi / Xe buýt");
        setText("mapInfo", "Bấm vào một khu vực trên bản đồ để xem mô tả.");

        setText("processTitle", "Hướng dẫn quy trình bay");
        setText("processHint", "Chọn loại hành trình để xem các bước cần thực hiện.");
        setText("processDomesticBtn", "Bay nội địa");
        setText("processInternationalBtn", "Bay quốc tế");
        setText("processFirstTimeBtn", "Đi máy bay lần đầu");
        setText("processBaggageBtn", "Hành lý");
        setText("processContent", "Bấm vào một mục để xem hướng dẫn chi tiết.");

        setText("chatTitle", "Chatbot hỗ trợ hành khách");
        setText("chatStatusText", "Trợ lý đang hoạt động");
        setText("clearChatBtn", "Xóa lịch sử chat");
        setPlaceholder("userInput", "Nhập câu hỏi của bạn...");
        setText("sendBtn", "Gửi");

        setText("quickFirstTime", "Đi máy bay lần đầu");
        setText("quickDomestic", "Bay nội địa");
        setText("quickInternational", "Bay quốc tế");
        setText("quickLostBaggage", "Mất hành lý");
        setText("quickTransport", "Di chuyển");

        setText("defaultBotGreeting", "Xin chào! Tôi có thể hỗ trợ bạn về check-in, hành lý, quy trình bay, phương tiện di chuyển và thông tin sân bay.");
    }

    if (lang === "en") {
        document.title = "Long Thanh International Airport Assistant";

        setText("appTitle", "Long Thanh International Airport Assistant");
        setText("appSubtitle", "Virtual assistant supporting passengers at Long Thanh International Airport");

        setText("navFlight", "Flights");
        setText("navMap", "Map");
        setText("navProcess", "Process");
        setText("navChat", "Chatbot");

        setText("flightTitle", "Flight Search");
        setText("flightHint", "Sample codes: VN123, VJ456, QH789");
        setPlaceholder("flightInput", "Enter flight number, e.g. VN123");
        setText("flightSearchBtn", "Search");

        setText("mapTitle", "Simple Airport Map");
        setText("mapHint", "Illustration of main areas inside the terminal.");
        setText("mapEntrance", "Entrance Hall");
        setText("mapCheckin", "Check-in Counters");
        setText("mapSecurity", "Security Check");
        setText("mapImmigration", "Immigration");
        setText("mapFood", "Food Court");
        setText("mapGateA", "Gate Area A");
        setText("mapGateB", "Gate Area B");
        setText("mapBaggage", "Baggage Claim");
        setText("mapTransport", "Taxi / Bus");
        setText("mapInfo", "Click an area on the map to view its description.");

        setText("processTitle", "Flight Process Guide");
        setText("processHint", "Choose a travel type to view the required steps.");
        setText("processDomesticBtn", "Domestic");
        setText("processInternationalBtn", "International");
        setText("processFirstTimeBtn", "First-time flyer");
        setText("processBaggageBtn", "Baggage");
        setText("processContent", "Click an option to view detailed instructions.");

        setText("chatTitle", "Passenger Support Chatbot");
        setText("chatStatusText", "Assistant is online");
        setText("clearChatBtn", "Clear chat history");
        setPlaceholder("userInput", "Type your question...");
        setText("sendBtn", "Send");

        setText("quickFirstTime", "First-time flyer");
        setText("quickDomestic", "Domestic flight");
        setText("quickInternational", "International flight");
        setText("quickLostBaggage", "Lost baggage");
        setText("quickTransport", "Transportation");

        setText("defaultBotGreeting", "Hello! I can help you with check-in, baggage, flight procedures, transportation, and airport information.");
    }

    updateCurrentTime();
    updateLanguageButtons(lang);
}

window.addEventListener("load", function () {
    const savedLanguage = localStorage.getItem("language") || "vi";
    setLanguage(savedLanguage);
    updateLanguageButtons(savedLanguage);
});

function getCurrentLanguage() {
    return localStorage.getItem("language") || "vi";
}

function showMapInfoByKey(key) {
    const lang = getCurrentLanguage();

    const mapData = {
        vi: {
            entrance: {
                title: "Sảnh vào",
                description: "Khu vực hành khách vào nhà ga, kiểm tra thông tin chuyến bay và chuẩn bị làm thủ tục."
            },
            checkin: {
                title: "Quầy check-in",
                description: "Khu vực làm thủ tục bay, nhận thẻ lên máy bay và gửi hành lý ký gửi."
            },
            security: {
                title: "Kiểm tra an ninh",
                description: "Khu vực soi chiếu hành lý xách tay và kiểm tra an ninh trước khi vào khu vực chờ."
            },
            immigration: {
                title: "Xuất nhập cảnh",
                description: "Khu vực làm thủ tục xuất cảnh hoặc nhập cảnh dành cho các chuyến bay quốc tế."
            },
            food: {
                title: "Khu ăn uống",
                description: "Khu vực nhà hàng, quán cà phê và dịch vụ ăn uống cho hành khách."
            },
            gateA: {
                title: "Cổng chờ A",
                description: "Khu vực chờ lên máy bay tại các cổng nhóm A."
            },
            gateB: {
                title: "Cổng chờ B",
                description: "Khu vực chờ lên máy bay tại các cổng nhóm B."
            },
            baggage: {
                title: "Nhận hành lý",
                description: "Khu vực lấy hành lý ký gửi sau khi chuyến bay hạ cánh."
            },
            transport: {
                title: "Taxi / Xe buýt",
                description: "Khu vực đón taxi, xe công nghệ, xe buýt hoặc xe đưa đón về trung tâm thành phố."
            }
        },
        en: {
            entrance: {
                title: "Entrance Hall",
                description: "Area where passengers enter the terminal, check flight information, and prepare for check-in."
            },
            checkin: {
                title: "Check-in Counters",
                description: "Area for flight check-in, boarding pass collection, and checked baggage drop-off."
            },
            security: {
                title: "Security Check",
                description: "Area for carry-on baggage screening and security checks before entering the waiting area."
            },
            immigration: {
                title: "Immigration",
                description: "Area for departure or arrival immigration procedures for international flights."
            },
            food: {
                title: "Food Court",
                description: "Area with restaurants, cafés, and food services for passengers."
            },
            gateA: {
                title: "Gate Area A",
                description: "Waiting area for boarding at gate group A."
            },
            gateB: {
                title: "Gate Area B",
                description: "Waiting area for boarding at gate group B."
            },
            baggage: {
                title: "Baggage Claim",
                description: "Area for collecting checked baggage after the flight lands."
            },
            transport: {
                title: "Taxi / Bus",
                description: "Area for taxis, ride-hailing cars, buses, or shuttle services to the city center."
            }
        }
    };

    const item = mapData[lang][key];
    showMapInfo(item.title, item.description);
}

function translateFlightStatus(status, lang) {
    const statusMap = {
        vi: {
            "Đang làm thủ tục": "Đang làm thủ tục",
            "Đúng giờ": "Đúng giờ",
            "Chưa mở check-in": "Chưa mở check-in"
        },
        en: {
            "Đang làm thủ tục": "Check-in open",
            "Đúng giờ": "On time",
            "Chưa mở check-in": "Check-in not open"
        }
    };

    return statusMap[lang][status] || status;
}

function updateLanguageButtons(lang) {
    const langViBtn = document.getElementById("langViBtn");
    const langEnBtn = document.getElementById("langEnBtn");

    if (!langViBtn || !langEnBtn) return;

    langViBtn.classList.remove("active");
    langEnBtn.classList.remove("active");

    if (lang === "vi") {
        langViBtn.classList.add("active");
    }

    if (lang === "en") {
        langEnBtn.classList.add("active");
    }
}