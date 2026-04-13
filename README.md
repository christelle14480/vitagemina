# VitaGemina

**Clinical AI Twin System**

VitaGemina is a clinical digital twin platform that integrates real-time biosensor data, pharmacogenomics, and predictive AI modeling to simulate patient-specific outcomes. It is designed for demonstration, research, and educational purposes — **not for clinical use**.

---

## Features

- **Live Vital Signs Simulation**
  - ECG (Lead II) with realistic heart rate display (~78 BPM)
  - Continuous glucose monitoring (CGM) with target range (70–140 mg/dL)
  - SpO₂ display

- **Organ System Index**
  - Six-domain radar chart (Hepatic, Renal, Cardiac, Neuro, Immune, Metabolic)
  - Highlights indices below threshold

- **Blood Chemistry Panel**
  - WBC, HbA1c, Creatinine, LDL-C, CRP, eGFR with status indicators (Normal / Borderline / Alert)

- **Pharmacogenomic Profile**
  - CYP2D6, BRCA2, TPMT, DPYD, VKORC1, HLA-B status
  - Illustrative interpretations of patient-specific drug responses

- **Drug Simulation Engine**
  - PK/PD curves for drugs such as Carboplatin AUC5
  - Patient-specific vs population-level simulation
  - Genomic-informed dose adjustments and safety monitoring

- **Predictive Event Timeline**
  - AI-driven forecast for arrhythmia, glucose dips, and CRP spikes
  - Ensemble model integrates ECG trends, CGM, labs, and pharmacogenomic weighting

---

## Screenshots

Screenshots and reference documentation are available in the `/docs` folder:

- **Dashboard Overview:** `/docs/VITAGEMINA — Clinical AI Twin System.pdf`  
- **Cardiac & CGM Panels, Organ Radar, Labs, Genomics, Drug Simulation, Predictive Timeline**

*(Open the PDF in `/docs` to view pages 1–3 as full-interface screenshots.)*

---

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vitagemina.git
cd vitagemina
```

2. Install dependencies:
```bash
npm install
```

3. Run the app in development mode:
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Build for production:
```bash
npm run build
```

---

## Technical Details

- **Framework:** React  
- **Visualization:** Recharts for line, area, and radar charts  
- **State Management:** React hooks (`useState`, `useEffect`, `useMemo`)  
- **Responsive Layout:** Desktop and tablet preferred; controlled companion views on iPhone/Android  
- **Theme:** Epic-style clinical interface with high readability  
- **Snapshot Mode:** Fixed patient state for demonstration and review  

---

## Notes

- Demo purpose only — **not for clinical use**  
- Shows mirrored patient state, therapy simulation, and predictive outcomes  
- Browser-only implementation; no backend required  
- Optional local AI for offline demonstration  
- Full deployment requires secure hosting, FHIR/HL7 integration, SSO/MFA, and audit logging  

---

## License

**MIT License**  
This repository is open-source under MIT. You can freely use, modify, and distribute the code. See [LICENSE](./LICENSE) for details.

---

## Author

**Christelle A.**  
Founder & Developer of VitaGemina

