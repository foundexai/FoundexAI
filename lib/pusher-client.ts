import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;
let pusherToken: string | null = null;
let signingToken: string | null = null;

export function setPusherToken(token: string) {
  pusherToken = token;
}

export function setSigningToken(token: string) {
  signingToken = token;
}

export function clearPusherTokens() {
  pusherToken = null;
  signingToken = null;
}

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";
    
    if (!key) {
      console.warn("Pusher public key not found. Real-time features disabled.");
      return null;
    }

    pusherClient = new Pusher(key, {
      cluster: cluster,
      forceTLS: true,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          "Content-Type": "application/json",
        },
      },
      authorizer: (channel) => {
        return {
          authorize: (socketId, callback) => {
            fetch("/api/pusher/auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(pusherToken ? { "Authorization": `Bearer ${pusherToken}` } : {}),
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
                signing_token: signingToken,
              }),
            })
              .then(async (res) => {
                if (!res.ok) {
                  const error = new Error("Pusher auth failed");
                  callback(error, null);
                  return;
                }
                const data = await res.json();
                callback(null, data);
              })
              .catch((err: Error) => {
                console.error("Pusher authorization error:", err);
                callback(err, null);
              });
          },
        };
      },
    });

    pusherClient.connection.bind("error", (err: Error) => {
      console.error("Pusher connection error:", err);
    });

    pusherClient.connection.bind("connected", () => {
      console.log("Pusher connected successfully");
    });

    pusherClient.connection.bind("disconnected", () => {
      console.log("Pusher disconnected");
    });
  }

  return pusherClient;
}

export function disconnectPusher() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
    clearPusherTokens();
  }
}