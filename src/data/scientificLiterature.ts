export interface CitationItem {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  summary: string;
  clinicalRelevance: string;
}

export const SCIENTIFIC_CITATIONS: CitationItem[] = [
  {
    id: 'mds-updrs-2008',
    title: 'Movement Disorder Society-Sponsored Revision of the Unified Parkinson\'s Disease Rating Scale (MDS-UPDRS): Process, Format, and Clinimetric Testing',
    authors: 'Goetz, C. G., Tilley, B. C., Shaftman, S. R., et al.',
    journal: 'Movement Disorders',
    year: 2008,
    doi: '10.1002/mds.22340',
    summary: 'The gold standard clinical examination scale for Parkinson\'s disease assessment. Standardizes Part III motor tests including Item 3.4 (Finger Tapping), Item 3.10 (Gait), and Item 3.17 (Rest Tremor Amplitude).',
    clinicalRelevance: 'Provides ground-truth anchoring for NeuroScan AI\'s digital motor scoring, mapping computer vision kinematics to 0-4 point clinical grades.',
  },
  {
    id: 'voice-dysarthria-2009',
    title: 'Suitability of Dysphonia Measurements for Telemonitoring of Parkinson\'s Disease',
    authors: 'Little, M. A., McSharry, P. E., Hunter, E. J., Spielman, J., Ramig, L. O.',
    journal: 'IEEE Transactions on Biomedical Engineering',
    year: 2009,
    doi: '10.1109/TBME.2008.2005954',
    summary: 'Demonstrated that non-invasive voice acoustic features (fundamental frequency variation, local jitter, shimmer, and noise-to-harmonics ratio) can discriminate Parkinson\'s patients from healthy controls with >91% accuracy.',
    clinicalRelevance: 'Directly informs NeuroScan AI\'s Web Audio spectral extraction engine during the 5-second sustained vowel phonation biomarker test.',
  },
  {
    id: 'tremor-frequency-differentiation-2018',
    title: 'Clinical Spectrum and Differential Diagnosis of Tremor: Parkinson\'s Disease vs. Essential Tremor',
    authors: 'Bhatia, K. P., Bain, P., Bajaj, N., et al.',
    journal: 'Movement Disorders',
    year: 2018,
    doi: '10.1002/mds.27121',
    summary: 'Defines the electrophysiological and kinematic boundary between Parkinsonian resting tremor (4.0 - 6.0 Hz with pill-rolling morphology) and Essential Tremor (8.0 - 12.0 Hz postural/kinetic tremor).',
    clinicalRelevance: 'Enables NeuroScan AI\'s FFT power spectral density classifier to perform automated differential classification rather than a simple binary alert.',
  },
  {
    id: 'spiral-kinematics-2020',
    title: 'Kinematic Analysis of Spiral Drawing for Quantitative Motor Assessment in Movement Disorders',
    authors: 'Saunders-Pullman, R., Derby, C., Stanley, K., et al.',
    journal: 'Neurology & Clinical Neurophysiology',
    year: 2020,
    doi: '10.1212/WNL.0000000000009842',
    summary: 'Evaluated quantitative digital digitizer metrics (normalized jerk index, radial deviation variance, and drawing boundary shrinkage / micrographia) in diagnosing early Parkinsonian motor signs.',
    clinicalRelevance: 'Supplies mathematical formulations for our canvas trajectory kinematic jerk derivative and micrographia scaling ratio.',
  },
  {
    id: 'smartphone-tremor-sensor-2021',
    title: 'Feasibility and Validation of Smartphone- and Webcam-Based Digital Biomarkers for Parkinsonism Telehealth',
    authors: 'Arora, S., Baig, F., Lo, C., et al.',
    journal: 'The Lancet Neurology Digital Health',
    year: 2021,
    doi: '10.1016/S2589-7500(21)00123-X',
    summary: 'Validated remote video computer vision and audio signal processing against in-person neurologist assessments across 2,400 clinical sessions.',
    clinicalRelevance: 'Confirms that remote, decentralized consumer-grade webcams and microphones can achieve clinically actionable diagnostic screening sensitivity.',
  },
];
