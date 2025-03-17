export default async function handler(req, res) {
  const clientId = 3575;
  const clientCompany = "dFRKqXerJYawiStNm6tU";
  const clientSecret = "MzU3NWRGUktxWGVySllhd2lTdE5tNnRVY2U2NmY2ZTZmOWRlZjUxMGFjNDBiYTJlNjVjMmFjZGEwMTQyZmZhZQ==";
  const bannerSource = "adwords";

  // 1. Ping от dr.js
  if (req.method === "GET" && req.query?.dr_jsess === "1") {
    return res.status(200).json({ result: 0, message: "JS ping" });
  }

  // 2. Получение данных
  const getPostData = async () => {
    if (req.method !== 'POST') return {};
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => (body += chunk.toString()));
      req.on('end', () => {
        const parsed = new URLSearchParams(body);
        const data = {};

        if (parsed.has('data')) {
          try {
            data.request = JSON.parse(parsed.get('data'));
          } catch {
            try {
              data.request = JSON.parse(parsed.get('data')?.replace(/\\"/g, '"'));
            } catch {
              data.request = {};
            }
          }
        }

        if (parsed.has('jsdata')) {
          try {
            data.jsrequest = JSON.parse(parsed.get('jsdata'));
          } catch {
            data.jsrequest = {};
          }
        }

        if (parsed.has('crossref_sessionid')) {
          data.request = data.request || {};
          data.request["cr-session-id"] = parsed.get('crossref_sessionid');
        }

        resolve(data);
      });
    });
  };

  const postData = await getPostData();

  // 3. Сбор заголовков
  const serverHeaders = {
    REMOTE_ADDR: req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    HTTP_USER_AGENT: req.headers["user-agent"],
    HTTP_REFERER: req.headers["referer"] || "",
    SERVER_PORT: 443,
    REQUEST_TIME_FLOAT: Date.now() / 1000,
    bannerSource
  };

  // 4. Сбор полного payload
  const payload = {
    auth: {
      clientId,
      clientCompany,
      clientSecret
    },
    request: postData.request || {},
    jsrequest: postData.jsrequest || {},
    server: serverHeaders
  };

  // 5. Отправка на Palladium
  try {
    const response = await fetch("https://rbl.palladium.expert", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(flatten(payload))
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error sending to Palladium:", err);
    return res.status(500).json({ result: 0, message: "Request failed" });
  }
}

// Вспомогательная функция: превращает вложенный объект в плоский объект, как `http_build_query`
function flatten(obj, prefix = "") {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const pre = prefix ? `${prefix}[${key}]` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, pre));
    } else {
      acc[pre] = val;
    }
    return acc;
  }, {});
}
