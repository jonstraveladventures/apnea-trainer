Absolutely — here’s a README.md file you can use in your Cursor IDE project to document and replicate the logic from your Google Sheet training planner, including the formulas, session logic, and dynamic updates based on user input (like max breath-hold time).

⸻


# 🐬 Apnea Training Tracker – 6-Month Breath-Hold Planner

This project is a dynamic breath-hold (apnea) training schedule generator designed for freedivers. The planner mirrors a 6-month structured routine used in competitive freediving, with dynamic calculations based on the user's most recent maximum static breath-hold.

## 📆 Schedule Overview

- **Start Date:** August 2, 2025 (Saturday)
- **Duration:** 182 days (26 weeks)
- **Daily Focus Areas:**
  - **Saturday:** Max Breath-Hold
  - **Sunday:** Recovery & Flexibility
  - **Monday:** CO₂ Tolerance
  - **Tuesday:** Breath Control
  - **Wednesday:** O₂ Tolerance
  - **Thursday:** Mental + Technique
  - **Friday:** Advanced CO₂ Table

## 🧮 Column Structure

| Column | Name                   | Description                                                                 |
|--------|------------------------|-----------------------------------------------------------------------------|
| A      | Date                   | Sequential from start date                                                  |
| B      | Day                    | Calculated from `Date` (e.g., Monday)                                       |
| C      | Focus                  | Weekly focus area (based on `WEEKDAY`)                                      |
| D      | Session Type           | A description of the type of training                                       |
| E      | Session Details        | Automatically generated based on most recent max static hold               |
| F      | Notes                  | User-written notes about performance, mood, difficulty, etc.               |
| G      | Actual Max Hold (sec)  | User input: record max hold result (used to calculate future values)       |
| H      | Latest Max Hold (sec)  | Calculated: most recent non-empty value in column G                        |

---

## 🧠 Google Sheets Formulae

### 📅 `Column A` – Date
```excel
=DATE(2025,8,2)        # in A2
=A2+1                  # in A3 and drag down


⸻

📆 Column B – Day of Week

=TEXT(A2, "dddd")


⸻

🔁 Column C – Focus (based on weekday, starting Monday = 1)

=CHOOSE(WEEKDAY(A2, 2),
  "CO₂ Tolerance",
  "Breath Control",
  "O₂ Tolerance",
  "Mental + Technique",
  "CO₂ Tolerance",
  "Max Breath-Hold",
  "Recovery & Flexibility"
)


⸻

🧪 Column D – Session Type

=CHOOSE(WEEKDAY(A2, 2),
  "CO₂ Table",
  "Pranayama + Box Breathing",
  "O₂ Table",
  "Dry Statics + Visualization",
  "Advanced CO₂ Table",
  "Max Static Attempt + CO₂ Flush",
  "Thoracic & Diaphragm Stretching"
)


⸻

📋 Column E – Session Details (depends on H2)

=CHOOSE(WEEKDAY(A2, 2),
  "7× 2:00 holds. Rest: 2:00 → 0:15",
  "5 min belly breathing, 5× box (4-4-4-4), 3× ~" & ROUND(H2*0.5, 0) & " sec light holds",
  "7× holds with 2:00 rest. Hold times: 1:30 → 3:00",
  "5–7 min visualization. 2× ~" & ROUND(H2*0.7, 0) & " sec statics. 3× recovery drills",
  "5× ~" & ROUND(H2*0.625, 0) & " sec holds. Rest: 2:00 → 0:30",
  "Warm-up: 1:00 + 1:30 holds w/ 2:00 rest. Max attempt ~" & ROUND(H2*0.9, 0) & " sec (90%). Optional: 3× 1:30 / 1:00 rest",
  "3×30s diaphragm stretch, 2× side stretches, 5 min box breathing (4‑4‑4‑4)"
)


⸻

🧠 Column H – Latest Max Hold (propagates from column G)

=IF(G2<>"", G2, IF(ROW()=2, "", LOOKUP(2,1/(G$1:G1<>""), G$1:G1)))


⸻

📌 App Features to Implement (Suggestions)
	•	CSV or Google Sheets data import/export
	•	Input interface for daily Actual Max Hold
	•	Auto-regenerating schedule based on most recent max
	•	Charting for breath-hold progression
	•	Annotations/comments per session

⸻

💡 Example Use Case

User completes a max breath-hold of 4:00 (240 sec) on Saturday, logs 240 in Column G.
	•	Sunday → Recovery
	•	Tuesday → Breath control holds will use 120 sec (50%)
	•	Thursday → Static holds target 168 sec (70%)
	•	Friday → Table uses 150 sec (62.5%)

⸻

🛠 Tech Stack Ideas
	•	Frontend: React (or Svelte for speed)
	•	Backend: Express.js or Python FastAPI
	•	Storage: Local JSON / Firebase / Google Sheets API
	•	Tools: papaparse, dayjs, Google Sheets API, D3.js

⸻

🏁 License

MIT – use freely and breathe easy.

---

Let me know if you’d like:
- The same content broken into multiple files (e.g. for Next.js or Astro)
- A starter `data.json` structure to import into your app
- CSV generator or JSON schema to work from in code

You're set up for an awesome freediving tracker!