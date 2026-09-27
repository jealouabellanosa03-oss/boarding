/* ============================================================
   BOARDINGPAY SERVICE WORKER
   GitHub Pages /boarding/
   Offline Support
============================================================ */

const CACHE_NAME = "boardingpay-v2";

/*
   IMPORTANT:
   Use relative paths because the app is hosted at:

   https://jealouabellanosa03-oss.github.io/boarding/
*/

const APP_FILES = [
    "./",
    "./index.html",

    "./welcome.html",
    "./get-started.html",
    "./login.html",

    "./admin-register.html",
    "./create-account.html",
    "./completeprofile.html",
    "./admin-dashboard.html",

    "./landlord-register.html",
    "./landlord-dashboard.html",

    "./tenant-register.html",
    "./tenant-dashboard.html",

    "./paymentmethod.html",
    "./payment-details.html",
    "./payment-success.html",

    "./profile.html",
    "./settings.html",
    "./history.html",
    "./announcements.html",
    "./contact.html",
    "./forgot-password.html",

    "./script.js",
    "./style.css"
];


/* ============================================================
   INSTALL
============================================================ */

self.addEventListener("install", function (event) {

    console.log(
        "[BoardingPay SW] Installing..."
    );

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(function (cache) {

                console.log(
                    "[BoardingPay SW] Caching app files..."
                );

                /*
                   DO NOT use cache.addAll() here.

                   If ONE file is missing, addAll() fails
                   for the entire cache.

                   Instead, cache each file separately.
                */

                return Promise.all(

                    APP_FILES.map(function (file) {

                        return cache.add(file)
                            .then(function () {

                                console.log(
                                    "[BoardingPay SW] Cached:",
                                    file
                                );

                            })
                            .catch(function (error) {

                                console.warn(
                                    "[BoardingPay SW] Could not cache:",
                                    file,
                                    error
                                );

                                /*
                                   Ignore individual missing files.
                                   The Service Worker can still install.
                                */

                                return null;

                            });

                    })

                );

            })

            .then(function () {

                console.log(
                    "[BoardingPay SW] Installation complete."
                );

                return self.skipWaiting();

            })

            .catch(function (error) {

                console.error(
                    "[BoardingPay SW] Installation error:",
                    error
                );

            })

    );

});


/* ============================================================
   ACTIVATE
============================================================ */

self.addEventListener("activate", function (event) {

    console.log(
        "[BoardingPay SW] Activating..."
    );

    event.waitUntil(

        caches.keys()

            .then(function (cacheNames) {

                return Promise.all(

                    cacheNames
                        .filter(function (cacheName) {

                            return (
                                cacheName.startsWith(
                                    "boardingpay-"
                                ) &&
                                cacheName !== CACHE_NAME
                            );

                        })

                        .map(function (oldCache) {

                            console.log(
                                "[BoardingPay SW] Removing old cache:",
                                oldCache
                            );

                            return caches.delete(
                                oldCache
                            );

                        })

                );

            })

            .then(function () {

                console.log(
                    "[BoardingPay SW] Activation complete."
                );

                return self.clients.claim();

            })

    );

});


/* ============================================================
   FETCH
   CACHE FIRST
============================================================ */

self.addEventListener("fetch", function (event) {

    const request = event.request;

    /*
       Only handle GET requests.
    */

    if (request.method !== "GET") {
        return;
    }


    event.respondWith(

        caches.match(request)

            .then(function (cachedResponse) {

                /*
                   1. If cached, immediately return cache.
                */

                if (cachedResponse) {

                    return cachedResponse;

                }


                /*
                   2. Not cached.
                   Try the internet.
                */

                return fetch(request)

                    .then(function (networkResponse) {

                        /*
                           If valid response, save it.
                        */

                        if (
                            networkResponse &&
                            networkResponse.status === 200
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(function (cache) {

                                    cache.put(
                                        request,
                                        responseClone
                                    );

                                });

                        }

                        return networkResponse;

                    })

                    .catch(function (error) {

                        console.warn(
                            "[BoardingPay SW] Network unavailable:",
                            request.url
                        );


                        /*
                           3. OFFLINE FALLBACK
                        */

                        /*
                           For HTML/document requests,
                           return cached index.html.
                        */

                        if (
                            request.mode === "navigate" ||
                            request.destination === "document"
                        ) {

                            return caches.match(
                                "./index.html"
                            )

                            .then(function (fallback) {

                                if (fallback) {

                                    return fallback;

                                }

                                /*
                                   IMPORTANT:
                                   Never return undefined.
                                   Always return a Response.
                                */

                                return new Response(

                                    `
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta
                                            name="viewport"
                                            content="width=device-width,
                                            initial-scale=1.0"
                                        >
                                        <title>BoardingPay Offline</title>

                                        <style>
                                            body {
                                                margin: 0;
                                                min-height: 100vh;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                font-family: Arial,
                                                    sans-serif;
                                                background: #ffffff;
                                                color: #073f78;
                                                text-align: center;
                                                padding: 20px;
                                            }

                                            .box {
                                                max-width: 320px;
                                            }

                                            h1 {
                                                font-size: 22px;
                                                margin-bottom: 10px;
                                            }

                                            p {
                                                font-size: 14px;
                                                color: #7893a5;
                                            }
                                        </style>
                                    </head>

                                    <body>

                                        <div class="box">

                                            <h1>
                                                BoardingPay
                                            </h1>

                                            <p>
                                                You are currently
                                                offline.
                                            </p>

                                            <p>
                                                Please reconnect to
                                                the internet and try
                                                again.
                                            </p>

                                        </div>

                                    </body>
                                    </html>
                                    `,

                                    {
                                        status: 503,

                                        headers: {
                                            "Content-Type":
                                                "text/html"
                                        }

                                    }

                                );

                            });

                        }


                        /*
                           For images, CSS, JS, etc.
                           return a valid 503 Response
                           instead of undefined.
                        */

                        return new Response(
                            "Offline - resource not available.",
                            {
                                status: 503,
                                statusText:
                                    "Service Unavailable"
                            }
                        );

                    });

            })

    );

});


/* ============================================================
   MESSAGE
============================================================ */

self.addEventListener("message", function (event) {

    if (!event.data) {
        return;
    }


    /*
       Force activation
    */

    if (
        event.data.action ===
        "SKIP_WAITING"
    ) {

        self.skipWaiting();

    }


    /*
       Clear BoardingPay cache
    */

    if (
        event.data.action ===
        "CLEAR_CACHE"
    ) {

        event.waitUntil(

            caches.keys()
                .then(function (cacheNames) {

                    return Promise.all(

                        cacheNames
                            .filter(function (name) {

                                return name.startsWith(
                                    "boardingpay-"
                                );

                            })
                            .map(function (name) {

                                return caches.delete(
                                    name
                                );

                            })

                    );

                })

        );

    }

});
