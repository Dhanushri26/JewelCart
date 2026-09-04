import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { getProducts, normalizeProduct } from "../../api/products";
import { useAppContext } from "../../context/AppContext";

function simpleExtractProductQuery(text) {
  // crude normalization: remove polite phrases
  return text
    .toLowerCase()
    .replace(
      /buy me|buy|please|i want|i'd like|i want to buy|get me|order me/gi,
      "",
    )
    .replace(/[.?!]/g, "")
    .trim();
}

export default function VoiceAssistant() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { addToCart, showToast, user } = useAppContext();

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    setTranscript("");
    setMatch(null);
    setStatus("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setSupported(false);

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = async (ev) => {
      const text = ev.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      await handleCommand(text);
    };

    recog.onerror = (e) => {
      setStatus(`Recognition error: ${e.error}`);
      setListening(false);
    };

    recog.onend = () => setListening(false);

    recog.start();
    setListening(true);
    setStatus("Listening...");
  };

  const stopListening = () => {
    // the recognition stops itself; flip the UI state
    setListening(false);
    setStatus("");
  };

  const handleCommand = async (text) => {
    setStatus("Analyzing command...");
    const query = simpleExtractProductQuery(text);
    if (!query) {
      setStatus("Couldn't extract a product from that command.");
      return;
    }

    try {
      const data = await getProducts();
      const items = (data.items || []).map(normalizeProduct);
      const lowered = query.toLowerCase();

      // naive matching: check name, description, stone, category
      const found = items
        .map((p) => ({ p, score: scoreMatch(p, lowered) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      if (!found) {
        setStatus(`No product matched "${query}"`);
        return;
      }

      setMatch(found.p);
      setStatus(`Found: ${found.p.name}`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to search products.");
    }
  };

  const scoreMatch = (p, q) => {
    let s = 0;
    const fields = [p.name, p.description, p.category, p.stone, p.metal];
    fields.forEach((f) => {
      if (!f) return;
      const t = String(f).toLowerCase();
      if (t.includes(q)) s += 10;
      const parts = q.split(" ");
      parts.forEach((part) => {
        if (part && t.includes(part)) s += 2;
      });
    });
    return s;
  };

  const proceedToBuy = async () => {
    if (!match) return;

    try {
      setStatus("Adding item to cart...");
      // Use context addToCart so cart UI refreshes
      await addToCart(match);
      showToast(
        `Added ${match.name} to cart. Continue to checkout to complete purchase.`,
        "success",
      );

      // Navigate to the dedicated checkout screen — include prefill shipping info
      const prefill = {
        fullName: user?.name || "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
      };

      navigate("/checkout", {
        state: {
          prefillShipping: prefill,
          voiceOrderNotes: transcript,
          voiceOrder: true,
        },
      });
      setStatus("Redirected to checkout.");
      setMatch(null);
      setTranscript("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to add item to cart. See console for details.");
      showToast("Could not add item to cart.", "error");
    }
  };

  return (
    <div className="voice-assistant-root">
      {!supported && (
        <div className="va-notice">
          Voice recognition not supported in this browser.
        </div>
      )}

      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60 }}>
        <div className="rounded-full shadow-lg bg-white p-3">
          <button
            onClick={() => (listening ? stopListening() : startListening())}
            className={`p-2 rounded-md flex items-center justify-center ${listening ? "bg-red-500 text-white" : "bg-amber-600 text-white"}`}
            aria-label={listening ? "Stop listening" : "Start voice assistant"}
          >
            <Mic size={18} />
          </button>
        </div>
      </div>

      {transcript && (
        <div
          style={{ position: "fixed", right: 20, bottom: 80, zIndex: 60 }}
          className="bg-white rounded shadow p-3 max-w-xs"
        >
          <strong>Heard:</strong>
          <div>{transcript}</div>
        </div>
      )}

      {status && (
        <div
          style={{ position: "fixed", right: 20, bottom: 150, zIndex: 60 }}
          className="bg-white rounded shadow p-3 max-w-xs"
        >
          <strong>Status:</strong>
          <div>{status}</div>
        </div>
      )}

      {match && (
        <div
          style={{ position: "fixed", right: 20, bottom: 240, zIndex: 70 }}
          className="bg-white rounded shadow p-4 max-w-sm w-80"
        >
          <div className="flex gap-3">
            <img
              src={match.image}
              alt={match.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <div className="font-semibold">{match.name}</div>
              <div className="text-sm text-stone-500">{match.description}</div>
              <div className="mt-2 font-semibold">
                ${match.price.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={proceedToBuy}
              className="bg-amber-600 text-white px-3 py-1 rounded"
            >
              Proceed to buy
            </button>
            <button
              onClick={() => setMatch(null)}
              className="px-3 py-1 rounded border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
