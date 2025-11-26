import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
    vus: 10,
    duration: "30s",
};

export default function () {
    const url = "http://app:3000/auth/login";

    const payload = JSON.stringify({
        email: "leonelcappiello@gmail.com",
        password: "asdjklqwe",
        turnstileToken: "prueba",
    });

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        "status is 200": (r) => r.status === 200,
    });

    if (res.status !== 200) {
        console.error(`ERROR ${res.status}: ${res.body}`);
    }

    sleep(1);
}
