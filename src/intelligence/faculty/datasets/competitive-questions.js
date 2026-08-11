/**
 * Faculty Assessment — COMPETITIVE QUESTION DATASET (Phase 29).
 *
 * ONE source of truth for competitive question intelligence:
 *  - competitiveQuestions  → JEE + NEET questions with full metadata
 *  - universityPyqQuestions → university PYQ records with stable IDs
 *
 * Every record has a STABLE question id so the Question Bank, PYQ
 * Intelligence and the Question Paper Generator share one identity
 * (Part 7/20 of the phase brief). PYQ questions carry `isPyq: true` and a
 * `pyq` block {exam, year, session} so the bank knows the paper origin.
 *
 * Content is deterministic demo material for the frontend prototype —
 * clearly marked `source: 'demo'` (no claims about official papers).
 * JEE subjects: Physics · Mathematics · Chemistry
 * NEET subjects: Physics · Chemistry · Biology
 */

const M = 4 // +4 correct / -1 incorrect (JEE & NEET MCQs)

function build({ exam, subject, code, rows }) {
  return rows.map((r, i) => {
    const [year, session, chapter, topic, question, a, b, c, d, answer, explanation, difficulty, questionType, marks = M, neg = 1] = r
    return {
      id: `CQ-${exam}-${code}-${String(i + 1).padStart(3, '0')}`,
      exam,
      subject,
      subjectCode: code,
      year: String(year),
      session,
      chapter,
      topic,
      question,
      options: [a, b, c, d],
      answer,
      explanation,
      difficulty,
      questionType,
      marks,
      negativeMarks: neg,
      source: 'demo',
      isPyq: true,
      pyq: { exam, year: String(year), session },
      bankLinked: false,
      tags: ['Competitive', subject, chapter],
    }
  })
}

const JEE_PHY = build({
  exam: 'JEE Main', subject: 'Physics', code: 'PHY',
  rows: [
    ['2025', 'S1', 'Kinematics', 'Motion in one dimension', 'A particle moves with velocity v(t) = 6t − 2 m/s. Its displacement in the first 2 seconds is:', '4 m', '8 m', '10 m', '12 m', 'B', 'Integrate v over 0–2 s: 3t² − 2t evaluated 0→2 gives 12 − 4 = 8 m.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Kinematics', 'Projectile motion', 'A projectile is fired at 45° with speed 20 m/s. Its maximum height (g = 10 m/s²) is:', '5 m', '10 m', '15 m', '20 m', 'B', 'H = u² sin²θ / 2g = 400 × 0.5 / 20 = 10 m.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Kinematics', 'Relative motion', 'Two trains 120 m and 80 m long run on parallel tracks at 54 km/h and 36 km/h in the same direction. Time to cross is:', '20 s', '40 s', '60 s', '80 s', 'B', 'Relative speed 5 m/s; total length 200 m → 200/5 = 40 s.', 'Medium', 'MCQ'],
    ['2023', 'S1', 'Laws of Motion', 'Newton laws', 'A 2 kg block is pulled by a horizontal force 10 N on a frictionless floor. Acceleration is:', '2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²', 'B', 'a = F/m = 10/2 = 5 m/s².', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Laws of Motion', 'Friction', 'A 5 kg block rests on a surface with μ = 0.4. Minimum force to just move it (g = 10) is:', '10 N', '20 N', '30 N', '40 N', 'B', 'f = μmg = 0.4 × 5 × 10 = 20 N.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Laws of Motion', 'Constraint motion', 'In a pulley system with two masses 3 kg and 1 kg over a light pulley, tension in the string is (g = 10):', '12 N', '15 N', '20 N', '30 N', 'B', 'a = (3−1)g/4 = 5; T = 1(10+5) = 15 N.', 'Medium', 'MCQ'],
    ['2024', 'S1', 'Work, Energy & Power', 'Work-energy theorem', 'A body of mass 2 kg moving at 4 m/s is brought to rest by a constant force. Work done by the force is:', '8 J', '16 J', '32 J', '64 J', 'B', 'W = ½mv² = ½ × 2 × 16 = 16 J.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Work, Energy & Power', 'Power', 'A pump lifts 200 kg of water to a height of 10 m in 20 s. Output power (g = 10) is:', '500 W', '1000 W', '2000 W', '4000 W', 'B', 'P = mgh/t = 200×10×10/20 = 1000 W.', 'Easy', 'MCQ'],
    ['2023', 'S2', 'Rotational Motion', 'Moment of inertia', 'Moment of inertia of a solid sphere (mass M, radius R) about its diameter is:', '(2/5)MR²', '(1/2)MR²', '(2/3)MR²', 'MR²', 'A', 'Standard result: solid sphere about diameter = (2/5)MR².', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Rotational Motion', 'Rolling motion', 'A disc rolls without slipping; ratio of rotational KE to total KE is:', '1/2', '1/3', '2/3', '1/4', 'B', 'Krot/Ktot = (½Iω²)/(½mv²+½Iω²) with I = ½mR² → 1/3.', 'Medium', 'MCQ'],
    ['2024', 'S2', 'Gravitation', 'Kepler laws', 'If the orbital radius of a planet doubles, its time period becomes:', '2×', '2√2×', '4×', '8×', 'B', 'Kepler third law: T ∝ r^(3/2) → 2^(3/2) = 2√2.', 'Medium', 'MCQ'],
    ['2025', 'S2', 'Gravitation', 'Escape velocity', 'Escape velocity from a planet of radius R and mass M is:', '√(2GM/R)', '√(GM/R)', '√(GM/2R)', '2√(GM/R)', 'A', 'Standard: v_e = √(2GM/R).', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Thermodynamics', 'First law', 'In an adiabatic process, the change in internal energy of an ideal gas equals:', 'Heat added', 'Work done on gas', 'Zero', 'Work done by gas', 'B', 'Adiabatic: Q = 0 so ΔU = W_on (work done on gas).', 'Medium', 'MCQ'],
    ['2025', 'S1', 'Thermodynamics', 'Carnot engine', 'A Carnot engine operates between 400 K and 300 K. Its efficiency is:', '15%', '25%', '75%', '100%', 'B', 'η = 1 − T2/T1 = 1 − 300/400 = 25%.', 'Easy', 'MCQ'],
    ['2023', 'S1', 'Current Electricity', 'Ohm law', 'A wire of resistance 4 Ω is stretched to twice its length. New resistance is:', '4 Ω', '8 Ω', '12 Ω', '16 Ω', 'D', 'R ∝ L²/A volume const → 4× → 16 Ω.', 'Medium', 'MCQ'],
    ['2025', 'S2', 'Current Electricity', 'Kirchhoff laws', 'In a Wheatstone bridge at balance, the galvanometer current is:', 'Maximum', 'Half of supply', 'Zero', 'Double of arm current', 'C', 'Balanced bridge: no potential difference across the galvanometer.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Electrostatics', 'Coulomb law', 'Two charges 2 μC and 8 μC repel with force F. If both are doubled, the force becomes:', 'F', '2F', '4F', '8F', 'C', 'F ∝ q1q2 → 2×2 = 4F.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Electrostatics', 'Electric potential', 'Potential at distance r from a point charge q is:', 'kq/r', 'kq/r²', 'kq²/r', 'kqr', 'A', 'V = kq/r (scalar).', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Optics', 'Ray optics', 'A concave mirror of focal length 20 cm forms a real image at 30 cm. Object distance is:', '40 cm', '60 cm', '80 cm', '120 cm', 'B', '1/f = 1/v + 1/u → 1/20 = 1/30 + 1/u → u = 60 cm.', 'Medium', 'MCQ'],
    ['2025', 'S1', 'Optics', 'Wave optics', 'In Young double-slit experiment, fringe width β is doubled when:', 'Slit separation doubles', 'Screen distance halves', 'Screen distance doubles', 'Wavelength halves', 'C', 'β = λD/d → doubling D doubles β.', 'Easy', 'MCQ'],
    ['2023', 'S2', 'Modern Physics', 'Photoelectric effect', 'The stopping potential depends on the incident light:', 'Intensity', 'Frequency', 'Polarisation', 'Phase', 'B', 'Kmax = hν − φ → stopping potential ∝ frequency.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Modern Physics', 'Nuclear physics', 'In a nuclear fission of U-235, the typical number of neutrons released per event is:', '1', '2–3', '10', '100', 'B', 'Fission typically releases 2–3 neutrons.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Modern Physics', 'Dual nature', 'The de Broglie wavelength of a particle with momentum p is:', 'h/p', 'p/h', 'h·p', 'h/p²', 'A', 'λ = h/p.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Electrostatics', 'Capacitance', 'A parallel plate capacitor with air has capacitance C. Filling with dielectric k = 4 gives:', 'C/4', 'C/2', '4C', 'C', 'C', 'C′ = kC = 4C.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Current Electricity', 'Heating effect', 'A 60 W bulb runs for 2 hours. Energy consumed is:', '120 J', '432 kJ', '120 kWh', '7200 J', 'B', 'E = Pt = 60 × 7200 = 432 kJ.', 'Easy', 'MCQ'],
  ],
})

const JEE_MAT = build({
  exam: 'JEE Main', subject: 'Mathematics', code: 'MAT',
  rows: [
    ['2025', 'S1', 'Sets & Relations', 'Sets', 'If A = {1,2,3,4} and B = {3,4,5}, then A − B has:', '1 element', '2 elements', '3 elements', '4 elements', 'B', 'A − B = {1,2} → 2 elements.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Quadratic Equations', 'Roots', 'The roots of x² − 5x + 6 = 0 are:', '2, 3', '−2, −3', '1, 6', '−1, 6', 'A', 'x² −5x+6 = (x−2)(x−3).', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Quadratic Equations', 'Nature of roots', 'For x² + 4x + 5 = 0, the discriminant is:', '−4', '4', '16', '36', 'A', 'D = 16 − 20 = −4 (complex roots).', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Sequences & Series', 'AP', 'The 10th term of the AP 3, 7, 11, … is:', '35', '39', '43', '47', 'B', 'a10 = 3 + 9×4 = 39.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Sequences & Series', 'GP', 'The sum of the infinite GP 1 + 1/2 + 1/4 + … is:', '1', '2', '3', '4', 'B', 'S∞ = a/(1−r) = 1/(1−½) = 2.', 'Easy', 'MCQ'],
    ['2023', 'S1', 'Sequences & Series', 'AGP', 'Sum to n terms of 1 + 2·2 + 3·4 + 4·8 + … (AGP) grows as:', 'Linear', 'Quadratic', 'Exponential', 'Logarithmic', 'C', 'The GP factor 2 dominates → exponential growth.', 'Hard', 'MCQ'],
    ['2025', 'S2', 'Trigonometry', 'Identities', 'sin²θ + cos²θ equals:', '0', '1', '2', 'sin 2θ', 'B', 'Pythagorean identity.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Trigonometry', 'Compound angles', 'sin(A + B) equals:', 'sinA cosB + cosA sinB', 'sinA cosB − cosA sinB', 'cosA cosB + sinA sinB', 'sinA sinB + cosA cosB', 'A', 'Standard compound-angle formula.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Coordinate Geometry', 'Straight lines', 'The slope of the line 3x + 4y = 12 is:', '−3/4', '3/4', '−4/3', '4/3', 'A', 'y = −3/4 x + 3 → slope −3/4.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Coordinate Geometry', 'Circle', 'The centre of the circle x² + y² − 6x + 8y = 0 is:', '(3, −4)', '(−3, 4)', '(6, −8)', '(−6, 8)', 'A', 'Centre = (−g, −f) = (3, −4).', 'Medium', 'MCQ'],
    ['2025', 'S2', 'Coordinate Geometry', 'Parabola', 'The focus of the parabola y² = 8x is:', '(0, 2)', '(2, 0)', '(0, 4)', '(4, 0)', 'B', 'y² = 4ax → 4a = 8 → a = 2 → focus (2, 0).', 'Medium', 'MCQ'],
    ['2024', 'S1', 'Limits & Derivatives', 'Limits', 'lim(x→0) sin x / x equals:', '0', '1', '∞', '−1', 'B', 'Standard limit = 1.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Limits & Derivatives', 'Derivatives', 'd/dx (x³ − 3x² + 5) at x = 2 is:', '0', '6', '12', '24', 'A', '3x² − 6x at x=2 → 12 − 12 = 0.', 'Easy', 'MCQ'],
    ['2023', 'S2', 'Limits & Derivatives', 'L Hospital', 'lim(x→0) (e^x − 1)/x equals:', '0', '1', 'e', '∞', 'B', 'L Hospital or standard limit → 1.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Integral Calculus', 'Definite integrals', '∫₀¹ x² dx equals:', '1/4', '1/3', '1/2', '1', 'B', 'x³/3 evaluated 0→1 = 1/3.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Integral Calculus', 'Area under curve', 'Area bounded by y = x² and y = 0 from x = 0 to x = 1 is:', '1/4', '1/3', '1/2', '2/3', 'B', '∫₀¹ x² dx = 1/3.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Vectors & 3D', 'Vectors', 'If a = (1,2,2), its magnitude is:', '2', '3', '4', '9', 'B', '√(1+4+4) = 3.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Vectors & 3D', 'Dot product', 'The angle between vectors (1,0,0) and (0,1,0) is:', '0°', '45°', '90°', '180°', 'C', 'Perpendicular → 90°.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Vectors & 3D', 'Lines in space', 'Direction ratios of the line through (0,0,0) and (1,2,2) are:', '(1,2,2)', '(2,1,2)', '(1,1,1)', '(2,2,1)', 'A', 'Differences of coordinates = (1,2,2).', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Probability', 'Basic probability', 'Probability of getting a sum of 7 with two dice is:', '1/12', '1/6', '1/9', '1/36', 'B', '6 favourable / 36 = 1/6.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Probability', 'Conditional probability', 'If P(A) = 0.6, P(B) = 0.5 and P(A∩B) = 0.3, then P(A|B) is:', '0.3', '0.5', '0.6', '0.9', 'C', 'P(A|B) = 0.3/0.5 = 0.6.', 'Medium', 'MCQ'],
    ['2023', 'S1', 'Permutations & Combinations', 'Counting', 'The number of ways to arrange the letters of the word "EXAM" is:', '12', '24', '48', '120', 'B', '4! = 24.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Permutations & Combinations', 'Combinations', 'C(6,2) equals:', '10', '12', '15', '30', 'C', '6×5/2 = 15.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Matrices', 'Determinants', 'The determinant of [[2,3],[1,4]] is:', '5', '7', '8', '11', 'A', '2×4 − 3×1 = 5.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Matrices', 'Matrix operations', 'If A = [[1,2],[3,4]] and B = [[1,0],[0,1]], then AB equals:', 'A', 'B', '2A', 'Zero matrix', 'A', 'B is the identity matrix → AB = A.', 'Easy', 'MCQ'],
  ],
})

const JEE_CHE = build({
  exam: 'JEE Main', subject: 'Chemistry', code: 'CHE',
  rows: [
    ['2025', 'S1', 'Mole Concept', 'Stoichiometry', 'Moles in 44 g of CO₂ (M = 44) are:', '0.5', '1', '2', '4', 'B', '44/44 = 1 mol.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Mole Concept', 'Molarity', 'Molarity of a solution with 4 g NaOH in 1 L (M = 40) is:', '0.1 M', '0.2 M', '1 M', '2 M', 'A', '4/40 = 0.1 mol/L.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Atomic Structure', 'Quantum numbers', 'The maximum number of electrons in a 3d subshell is:', '2', '6', '10', '14', 'C', 'd subshell holds 10 electrons.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Atomic Structure', 'Bohr model', 'The energy of the nth Bohr orbit of hydrogen is proportional to:', 'n²', '1/n²', 'n', '1/n', 'B', 'E ∝ −1/n².', 'Medium', 'MCQ'],
    ['2025', 'S1', 'Chemical Bonding', 'VSEPR', 'The shape of NH₃ according to VSEPR is:', 'Trigonal planar', 'Trigonal pyramidal', 'Linear', 'Square planar', 'B', '3 bonds + 1 lone pair → trigonal pyramidal.', 'Medium', 'MCQ'],
    ['2024', 'S1', 'Chemical Bonding', 'Hybridisation', 'The hybridisation of carbon in CH₄ is:', 'sp', 'sp²', 'sp³', 'dsp²', 'C', '4 sigma bonds → sp³.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Chemical Bonding', 'Dipole moment', 'Among the following, the molecule with zero dipole moment is:', 'H₂O', 'NH₃', 'CO₂', 'HCl', 'C', 'Linear symmetric CO₂ → zero dipole.', 'Easy', 'MCQ'],
    ['2023', 'S1', 'Thermodynamics', 'Enthalpy', 'For an exothermic reaction, ΔH is:', 'Positive', 'Negative', 'Zero', 'Infinite', 'B', 'Exothermic releases heat → ΔH < 0.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Thermodynamics', 'Entropy', 'Entropy of an isolated system at equilibrium:', 'Increases', 'Decreases', 'Is maximum', 'Is zero', 'C', 'Equilibrium → maximum entropy.', 'Medium', 'MCQ'],
    ['2024', 'S1', 'Equilibrium', 'Kc', 'For the reaction H₂ + I₂ ⇌ 2HI, Kc = 49. The equilibrium favours:', 'Reactants', 'Products', 'Neither', 'Cannot decide', 'B', 'Kc > 1 → products favoured.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Equilibrium', 'pH', 'The pH of a 0.001 M HCl solution is:', '1', '2', '3', '4', 'C', 'pH = −log(10⁻³) = 3.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'Electrochemistry', 'Nernst equation', 'For a cell with E° = 1.1 V and n = 2, E at standard conditions is:', '0 V', '0.55 V', '1.1 V', '2.2 V', 'C', 'Standard conditions → E = E° = 1.1 V.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Electrochemistry', 'Faraday law', 'Charge needed to deposit 1 mol of silver (F = 96500 C) is:', '48250 C', '96500 C', '193000 C', '386000 C', 'B', 'Ag⁺ + e⁻ → 1 F per mole.', 'Medium', 'MCQ'],
    ['2024', 'S1', 'Organic Chemistry', 'GOC', 'The most stable carbocation among the following is:', 'CH₃⁺', 'C₂H₅⁺', '(CH₃)₂CH⁺', '(CH₃)₃C⁺', 'D', 'Tertiary carbocation is most stable.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Organic Chemistry', 'GOC', 'Electron-withdrawing group among the following is:', '−CH₃', '−OCH₃', '−NO₂', '−OH', 'C', '−NO₂ is strongly electron-withdrawing.', 'Easy', 'MCQ'],
    ['2023', 'S2', 'Organic Chemistry', 'Hydrocarbons', 'Markovnikov addition of HBr to propene gives:', '1-bromopropane', '2-bromopropane', '1,2-dibromopropane', 'Propane', 'B', 'Br adds to the more substituted carbon.', 'Medium', 'MCQ'],
    ['2025', 'S1', 'Organic Chemistry', 'Alcohols', 'Primary alcohols oxidise to:', 'Ketones', 'Aldehydes', 'Carboxylic acids via aldehyde', 'Ethers', 'C', 'Primary → aldehyde → carboxylic acid.', 'Medium', 'MCQ'],
    ['2024', 'S2', 'Organic Chemistry', 'Carbonyl compounds', 'Aldehydes give silver mirror with:', 'Fehling solution', 'Tollens reagent', 'Benedict solution', 'Lucas reagent', 'B', 'Tollens (ammoniacal AgNO₃) gives the silver mirror.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'Coordination Compounds', 'Nomenclature', 'The coordination number of Fe in [Fe(CN)₆]³⁻ is:', '3', '4', '6', '8', 'C', 'Six cyanide ligands → CN 6.', 'Easy', 'MCQ'],
    ['2024', 'S1', 'Coordination Compounds', 'Werner theory', 'Primary valence of a metal ion is satisfied by:', 'Ligands', 'Counter ions', 'Water only', 'Solvent', 'B', 'Primary valence = ionisation (counter ions).', 'Hard', 'MCQ'],
    ['2025', 'S2', 'p-Block', 'Group 15', 'Ammonia is prepared industrially by:', 'Contact process', 'Haber process', 'Ostwald process', 'Hall process', 'B', 'Haber process: N₂ + 3H₂ ⇌ 2NH₃.', 'Easy', 'MCQ'],
    ['2024', 'S2', 'p-Block', 'Group 17', 'The strongest oxidising halogen is:', 'F₂', 'Cl₂', 'Br₂', 'I₂', 'A', 'F₂ is the strongest oxidising agent.', 'Easy', 'MCQ'],
    ['2025', 'S1', 'd-Block', 'Properties', 'Which d-block ion is colourless in aqueous solution?', 'Cu²⁺', 'Zn²⁺', 'Ni²⁺', 'Cr³⁺', 'B', 'Zn²⁺ has a full d¹⁰ shell → colourless.', 'Medium', 'MCQ'],
    ['2023', 'S1', 'Chemical Kinetics', 'Rate laws', 'For a first-order reaction, the half-life is:', 'Independent of concentration', 'Doubles with concentration', 'Halves with concentration', 'Proportional to k²', 'A', 't½ = 0.693/k — concentration independent.', 'Easy', 'MCQ'],
    ['2025', 'S2', 'Chemical Kinetics', 'Arrhenius equation', 'Raising temperature increases rate mainly because:', 'Activation energy falls', 'Fraction of energetic collisions rises', 'Collision frequency only', 'Order changes', 'B', 'Boltzmann tail → more molecules exceed Ea.', 'Medium', 'MCQ'],
  ],
})

const NEET_PHY = build({
  exam: 'NEET UG', subject: 'Physics', code: 'PHY',
  rows: [
    ['2025', 'N1', 'Units & Measurement', 'Dimensions', 'The dimensional formula of force is:', '[MLT⁻²]', '[ML²T⁻²]', '[MLT⁻¹]', '[M⁻¹L³T⁻²]', 'A', 'F = ma → [MLT⁻²].', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Kinematics', 'Motion in one dimension', 'A body dropped from rest falls 45 m in:', '1 s', '2 s', '3 s', '4 s', 'C', 's = ½gt² → 45 = 5t² → t = 3 s.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Kinematics', 'Projectile motion', 'Horizontal range is maximum when the angle of projection is:', '30°', '45°', '60°', '90°', 'B', 'R ∝ sin2θ → max at 45°.', 'Easy', 'MCQ'],
    ['2023', 'N1', 'Laws of Motion', 'Newton second law', 'A net force of 15 N acts on a 3 kg body. Acceleration is:', '3 m/s²', '5 m/s²', '15 m/s²', '45 m/s²', 'B', 'a = 15/3 = 5 m/s².', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Laws of Motion', 'Friction', 'Static friction is:', 'Always less than kinetic', 'Equal to applied force up to a limit', 'Independent of normal reaction', 'Zero on rough surfaces', 'B', 'Static friction matches applied force until the limit.', 'Medium', 'MCQ'],
    ['2024', 'N2', 'Work, Energy & Power', 'Kinetic energy', 'If speed doubles, kinetic energy becomes:', '2×', '4×', '8×', '16×', 'B', 'KE ∝ v².', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Work, Energy & Power', 'Potential energy', 'The gravitational PE of a 2 kg mass at 10 m height (g = 10) is:', '100 J', '200 J', '400 J', '20 J', 'B', 'mgh = 2×10×10 = 200 J.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Rotational Motion', 'Torque', 'Torque is the time derivative of:', 'Linear momentum', 'Angular momentum', 'Moment of inertia', 'Work', 'B', 'τ = dL/dt.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Rotational Motion', 'Moment of inertia', 'Moment of inertia of a ring of mass M and radius R about its central axis is:', 'MR²', '½MR²', '(2/5)MR²', '(2/3)MR²', 'A', 'Ring: I = MR².', 'Easy', 'MCQ'],
    ['2023', 'N2', 'Gravitation', 'Variation of g', 'The value of g at a height h above the surface (h small) is approximately:', 'g(1 − 2h/R)', 'g(1 + 2h/R)', 'g(1 − h/R)', 'g(1 + h/R)', 'A', 'g′ ≈ g(1 − 2h/R) for h ≪ R.', 'Hard', 'MCQ'],
    ['2025', 'N1', 'Properties of Matter', 'Elasticity', 'Young modulus is the ratio of:', 'Stress to strain', 'Strain to stress', 'Force to area', 'Length to area', 'A', 'Y = stress/strain.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Properties of Matter', 'Surface tension', 'Surface tension has units:', 'N/m', 'N·m', 'N/m²', 'J·m', 'A', 'Force per unit length → N/m.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Thermodynamics', 'Isothermal process', 'For an isothermal process of an ideal gas, ΔU is:', 'Positive', 'Negative', 'Zero', 'Maximum', 'C', 'Isothermal: ΔT = 0 → ΔU = 0.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Thermodynamics', 'Second law', 'The second law of thermodynamics is best expressed by:', 'ΔU = Q − W', 'Entropy of an isolated system never decreases', 'PV = nRT', 'E = mc²', 'B', 'Second law → entropy statement.', 'Medium', 'MCQ'],
    ['2023', 'N1', 'KTG', 'Kinetic theory', 'RMS speed of gas molecules is proportional to:', '√T', 'T', 'T²', '1/T', 'A', 'v_rms ∝ √T.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Oscillations', 'SHM', 'In SHM, acceleration is maximum at:', 'Mean position', 'Extreme positions', 'Everywhere equal', 'Half amplitude', 'B', 'a = −ω²x → max at extremes.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Waves', 'Sound', 'The speed of sound in air increases with:', 'Decreasing temperature', 'Increasing temperature', 'Lower humidity', 'Lower pressure only', 'B', 'v ∝ √T.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Current Electricity', 'Series circuits', 'Two resistors 4 Ω and 6 Ω in series give:', '2.4 Ω', '10 Ω', '24 Ω', '1.5 Ω', 'B', 'R = 4 + 6 = 10 Ω.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Current Electricity', 'Parallel circuits', 'Two resistors 4 Ω and 6 Ω in parallel give:', '10 Ω', '2.4 Ω', '24 Ω', '5 Ω', 'B', '1/R = 1/4 + 1/6 = 5/12 → R = 2.4 Ω.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Magnetic Effects', 'Lorentz force', 'The force on a charge q moving with velocity v in a magnetic field B is:', 'q(v × B)', 'q(v · B)', 'qvB always', 'qE', 'A', 'F = q(v × B).', 'Medium', 'MCQ'],
    ['2023', 'N2', 'EM Induction', 'Faraday law', 'The induced EMF in a loop depends on:', 'Magnetic flux', 'Rate of change of flux', 'Area only', 'Resistance only', 'B', 'ε = −dΦ/dt.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Optics', 'Lens formula', 'A convex lens of focal length 20 cm forms an image at 60 cm. Object distance is:', '15 cm', '30 cm', '40 cm', '80 cm', 'B', '1/f = 1/v − 1/u → u = 30 cm (real object).', 'Hard', 'MCQ'],
    ['2024', 'N1', 'Optics', 'Total internal reflection', 'TIR occurs when light travels from:', 'Rarer to denser', 'Denser to rarer above critical angle', 'Denser to rarer below critical angle', 'Parallel to the interface', 'B', 'TIR needs denser → rarer above critical angle.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Modern Physics', 'Photoelectric effect', 'Einstein explained the photoelectric effect using:', 'Wave theory', 'Photon concept', 'Relativity', 'Nuclear model', 'B', 'Light quanta (photons).', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Modern Physics', 'Radioactivity', 'After two half-lives, the fraction of a radioactive sample remaining is:', '1/2', '1/4', '1/8', '1/16', 'B', '(1/2)² = 1/4.', 'Easy', 'MCQ'],
  ],
})

const NEET_CHE = build({
  exam: 'NEET UG', subject: 'Chemistry', code: 'CHE',
  rows: [
    ['2025', 'N1', 'Some Basic Concepts', 'Mole concept', 'The number of moles in 3.6 g of water (M = 18) is:', '0.1', '0.2', '0.5', '1.0', 'B', '3.6/18 = 0.2 mol.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Some Basic Concepts', 'Empirical formula', 'The empirical formula of glucose C₆H₁₂O₆ is:', 'C₆H₁₂O₆', 'CH₂O', 'C₂H₄O₂', 'C₃H₆O₃', 'B', 'Divide by 6 → CH₂O.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Structure of Atom', 'Electronic configuration', 'The number of unpaired electrons in Fe³⁺ (Z = 26) is:', '2', '3', '4', '5', 'D', 'Fe³⁺: [Ar]3d⁵ → 5 unpaired.', 'Medium', 'MCQ'],
    ['2024', 'N2', 'Structure of Atom', 'Aufbau principle', 'The order of filling 4s and 3d orbitals is:', '3d before 4s', '4s before 3d', 'Both fill together', '4p before 4s', 'B', '4s fills before 3d (Aufbau).', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Chemical Bonding', 'Ionic bond', 'Which pair forms an ionic bond?', 'H and Cl', 'Na and Cl', 'C and H', 'N and O', 'B', 'NaCl is ionic (metal + non-metal).', 'Easy', 'MCQ'],
    ['2023', 'N1', 'Chemical Bonding', 'Hydrogen bonding', 'Which liquid shows hydrogen bonding?', 'CCl₄', 'H₂O', 'CS₂', 'C₆H₆', 'B', 'Water has O–H···O hydrogen bonds.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'States of Matter', 'Gas laws', 'At constant temperature, PV for an ideal gas is:', 'Constant', 'Increasing', 'Decreasing', 'Zero', 'A', 'Boyle law: PV = constant.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'States of Matter', 'Ideal gas equation', 'The ideal gas equation is:', 'PV = nRT', 'PV = nT', 'P = nRT/V²', 'PV² = nRT', 'A', 'PV = nRT.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Thermodynamics', 'Hess law', 'Hess law is a consequence of:', 'First law of thermodynamics', 'Second law', 'Third law', 'Avogadro law', 'A', 'Enthalpy is a state function (first law).', 'Medium', 'MCQ'],
    ['2024', 'N2', 'Thermodynamics', 'Free energy', 'A reaction is spontaneous when ΔG is:', 'Positive', 'Negative', 'Zero', 'Infinite', 'B', 'ΔG < 0 → spontaneous.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Equilibrium', 'Le Chatelier', 'Increasing pressure shifts equilibrium toward:', 'Fewer moles of gas', 'More moles of gas', 'No shift ever', 'The side with more molecules', 'A', 'Le Chatelier: toward fewer gas moles.', 'Medium', 'MCQ'],
    ['2024', 'N1', 'Equilibrium', 'Buffer', 'A buffer is a mixture of:', 'Strong acid and strong base', 'Weak acid and its salt', 'Two strong acids', 'Two weak bases only', 'B', 'Weak acid + conjugate base salt.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Redox Reactions', 'Oxidation number', 'The oxidation state of Mn in KMnO₄ is:', '+5', '+6', '+7', '+8', 'C', '1 + x − 8 = 0 → x = +7.', 'Easy', 'MCQ'],
    ['2023', 'N2', 'Redox Reactions', 'Disproportionation', 'Disproportionation is when:', 'One species both oxidises and reduces', 'Two species exchange electrons', 'No electron transfer', 'Only reduction occurs', 'A', 'Same species → oxidised and reduced.', 'Medium', 'MCQ'],
    ['2025', 'N2', 'p-Block', 'Group 14', 'CO₂ is:', 'Linear', 'Bent', 'Trigonal planar', 'Tetrahedral', 'A', 'O=C=O is linear.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'p-Block', 'Group 16', 'The most abundant element in the Earth crust is:', 'Silicon', 'Oxygen', 'Aluminium', 'Iron', 'B', 'Oxygen ≈ 46.6% of crust.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'd & f Block', 'Lanthanoids', 'The common oxidation state of lanthanoids is:', '+1', '+2', '+3', '+4', 'C', 'Most stable lanthanoid state is +3.', 'Medium', 'MCQ'],
    ['2024', 'N2', 'Coordination Compounds', 'Isomerism', '[Co(NH₃)₅Cl]²⁺ shows which type of isomerism?', 'Linkage', 'Ionisation', 'Coordination', 'Geometrical', 'C', 'Cl can be inside or outside the coordination sphere.', 'Hard', 'MCQ'],
    ['2025', 'N2', 'Organic Chemistry', 'GOC', 'Which intermediate is most stable?', 'Primary carbocation', 'Secondary carbocation', 'Tertiary carbocation', 'Methyl cation', 'C', 'Tertiary > secondary > primary > methyl.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Organic Chemistry', 'Hydrocarbons', 'Alkanes react with halogens in the presence of UV light via:', 'Electrophilic addition', 'Free-radical substitution', 'Nucleophilic substitution', 'Elimination', 'B', 'Halogenation of alkanes is free-radical.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Organic Chemistry', 'Haloalkanes', 'SN1 reactions are favoured by:', 'Primary substrates', 'Tertiary substrates', 'Polar aprotic solvents only', 'Strong nucleophiles', 'B', 'Tertiary carbocation stability favours SN1.', 'Medium', 'MCQ'],
    ['2023', 'N2', 'Organic Chemistry', 'Aldehydes & Ketones', 'Aldehydes reduce Fehling solution to give:', 'Silver mirror', 'Red precipitate of Cu₂O', 'White precipitate', 'No reaction', 'B', 'Fehling → brick-red Cu₂O.', 'Medium', 'MCQ'],
    ['2025', 'N2', 'Organic Chemistry', 'Amines', 'Amines are basic due to the lone pair on:', 'Carbon', 'Nitrogen', 'Oxygen', 'Hydrogen', 'B', 'Lone pair on nitrogen accepts H⁺.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Biomolecules', 'Carbohydrates', 'Glucose and fructose are:', 'Anomers', 'Functional isomers', 'Position isomers', 'Chain isomers', 'B', 'Aldose vs ketose → functional isomers.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Biomolecules', 'Proteins', 'The bond linking amino acids in proteins is:', 'Glycosidic', 'Peptide', 'Ester', 'Hydrogen only', 'B', 'Peptide bonds between amino acids.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Chemistry in Everyday Life', 'Drugs', 'Aspirin acts as:', 'Antacid', 'Analgesic', 'Antibiotic', 'Antiseptic', 'B', 'Aspirin is an analgesic/antipyretic.', 'Easy', 'MCQ'],
  ],
})

const NEET_BIO = build({
  exam: 'NEET UG', subject: 'Biology', code: 'BIO',
  rows: [
    ['2025', 'N1', 'Diversity of Life', 'Classification', 'The two-kingdom classification was given by:', 'Linnaeus', 'Whittaker', 'Haeckel', 'Darwin', 'A', 'Linnaeus proposed two kingdoms (Plantae, Animalia).', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Diversity of Life', 'Viruses', 'Viruses are considered living because they:', 'Grow in size', 'Reproduce inside host cells', 'Metabolise outside host', 'Move actively', 'B', 'They replicate only inside host cells.', 'Medium', 'MCQ'],
    ['2025', 'N2', 'Cell Biology', 'Cell organelles', 'The powerhouse of the cell is the:', 'Ribosome', 'Mitochondrion', 'Golgi body', 'Lysosome', 'B', 'Mitochondria generate ATP.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Cell Biology', 'Cell cycle', 'DNA replication occurs in which phase?', 'G1', 'S', 'G2', 'M', 'B', 'S phase = synthesis of DNA.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Cell Biology', 'Biomembranes', 'The fluid mosaic model was proposed by:', 'Watson & Crick', 'Singer & Nicolson', 'Robert Hooke', 'Schleiden & Schwann', 'B', 'Singer & Nicolson (1972).', 'Easy', 'MCQ'],
    ['2023', 'N2', 'Plant Physiology', 'Photosynthesis', 'The primary CO₂ acceptor in C3 plants is:', 'PEP', 'RuBP', 'PGA', 'OAA', 'B', 'RuBP (C5) accepts CO₂ in C3 cycle.', 'Medium', 'MCQ'],
    ['2025', 'N1', 'Plant Physiology', 'Photosynthesis', 'Photosynthesis occurs in:', 'Chloroplast', 'Mitochondria', 'Ribosome', 'Nucleus', 'A', 'Chloroplasts house the light reactions + Calvin cycle.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Plant Physiology', 'Respiration', 'The net ATP yield from one glucose molecule in aerobic respiration is about:', '2', '18', '38', '76', 'C', '36–38 ATP (commonly quoted 38 in NCERT).', 'Medium', 'MCQ'],
    ['2025', 'N2', 'Plant Physiology', 'Transport', 'Water uptake by roots is mainly through:', 'Osmosis', 'Active transport', 'Diffusion only', 'Bulk flow only', 'A', 'Root hair uptake is osmotic.', 'Medium', 'MCQ'],
    ['2024', 'N1', 'Human Physiology', 'Digestion', 'Pepsin digests:', 'Carbohydrates', 'Proteins', 'Fats', 'Nucleic acids', 'B', 'Pepsin hydrolyses proteins in the stomach.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Human Physiology', 'Breathing', 'The volume of air inspired or expired with each normal breath is:', 'Tidal volume', 'Vital capacity', 'Residual volume', 'Total lung capacity', 'A', 'Tidal volume ≈ 500 mL.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Human Physiology', 'Circulation', 'The heart pumps blood to the lungs through the:', 'Aorta', 'Pulmonary artery', 'Pulmonary vein', 'Vena cava', 'B', 'Pulmonary artery carries deoxygenated blood to lungs.', 'Medium', 'MCQ'],
    ['2025', 'N2', 'Human Physiology', 'Excretion', 'The functional unit of the kidney is the:', 'Neuron', 'Nephron', 'Alveolus', 'Glomerulus only', 'B', 'Nephron = functional unit.', 'Easy', 'MCQ'],
    ['2023', 'N1', 'Human Physiology', 'Neural control', 'The gap between two neurons is the:', 'Axon', 'Synapse', 'Myelin sheath', 'Node of Ranvier', 'B', 'Synaptic cleft between neurons.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Human Physiology', 'Endocrine', 'Insulin is secreted by:', 'Liver', 'Pancreas', 'Adrenal gland', 'Thyroid', 'B', 'Pancreatic beta cells secrete insulin.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Genetics', 'Mendelian inheritance', 'In a monohybrid cross, the phenotypic ratio in F2 is:', '1:1', '3:1', '9:3:3:1', '1:2:1', 'B', 'Dominant:recessive = 3:1.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Genetics', 'Molecular genetics', 'The genetic material of most organisms is:', 'RNA', 'DNA', 'Protein', 'Lipid', 'B', 'DNA is the genetic material.', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Genetics', 'Central dogma', 'The central dogma of molecular biology is:', 'DNA → RNA → Protein', 'RNA → DNA → Protein', 'Protein → RNA → DNA', 'DNA → Protein → RNA', 'A', 'Transcription then translation.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Genetics', 'Human genetics', 'Down syndrome is caused by trisomy of chromosome:', '13', '18', '21', 'X', 'C', 'Trisomy 21.', 'Easy', 'MCQ'],
    ['2023', 'N2', 'Evolution', 'Evidence', 'The direct evidence for evolution comes from:', 'Fossils', 'Vestigial organs only', 'Comparative anatomy only', 'Embryology only', 'A', 'Palaeontological (fossil) evidence is direct.', 'Medium', 'MCQ'],
    ['2025', 'N2', 'Evolution', 'Natural selection', 'Natural selection acts on:', 'Genotype only', 'Phenotype', 'Species as a whole', 'Community', 'B', 'Selection operates on phenotypes.', 'Medium', 'MCQ'],
    ['2024', 'N1', 'Human Welfare', 'Immunity', 'Vaccines provide:', 'Passive immunity', 'Active immunity', 'Innate immunity only', 'No immunity', 'B', 'Vaccination = active acquired immunity.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Human Welfare', 'Microbes', 'Penicillin is obtained from:', 'Bacteria', 'Fungi', 'Virus', 'Algae', 'B', 'Penicillium (fungus).', 'Easy', 'MCQ'],
    ['2023', 'N1', 'Ecology', 'Ecosystem', 'The pyramid of energy is always:', 'Upright', 'Inverted', 'Spindle-shaped', 'Variable', 'A', 'Energy decreases up trophic levels.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Ecology', 'Population', 'The maximum population size an environment can sustain is:', 'Carrying capacity', 'Biotic potential', 'Population density', 'Growth rate', 'A', 'Carrying capacity (K).', 'Easy', 'MCQ'],
    ['2024', 'N2', 'Ecology', 'Biodiversity', 'Biodiversity hotspots are regions with:', 'Low endemism', 'High endemism under threat', 'No species', 'Only aquatic life', 'B', 'Hotspots = high endemic species + threat.', 'Easy', 'MCQ'],
    ['2025', 'N2', 'Biotechnology', 'Tools', 'Restriction enzymes cut DNA at:', 'Random sites', 'Specific recognition sequences', 'Only AT-rich regions', 'RNA only', 'B', 'Restriction endonucleases recognise palindromic sequences.', 'Medium', 'MCQ'],
    ['2024', 'N2', 'Biotechnology', 'Applications', 'Golden rice is enriched in:', 'Protein', 'Vitamin A (beta-carotene)', 'Vitamin C', 'Iron', 'B', 'Beta-carotene → pro-vitamin A.', 'Easy', 'MCQ'],
    ['2025', 'N1', 'Cell Biology', 'Plant tissues', 'Xylem transports:', 'Food', 'Water and minerals', 'Hormones only', 'CO₂', 'B', 'Xylem conducts water + minerals.', 'Easy', 'MCQ'],
    ['2024', 'N1', 'Human Physiology', 'Locomotion', 'The functional contractile unit of a muscle is the:', 'Sarcomere', 'Myofibril', 'Fascicle', 'Sarcolemma', 'A', 'Sarcomere between Z-lines.', 'Medium', 'MCQ'],
  ],
})

/* ------------------------------------------------------------------ */
/* University PYQ records (stable IDs, linked to the Question Bank)   */
/* ------------------------------------------------------------------ */
export const universityPyqQuestions = [
  { id: 'UPYQ-CS501-001', exam: 'University', year: '2025', session: 'End Sem', subject: 'CS501', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', chapter: 'Graph Algorithms', topic: 'Dijkstra & shortest paths', question: 'Trace Dijkstra shortest paths on a 5-vertex weighted graph from a given source.', options: ['Adjacency matrix', 'Min-heap priority queue', 'Stack', 'Queue only'], answer: 'B', explanation: 'A min-heap gives O(E log V) — the standard efficient implementation.', difficulty: 'Hard', questionType: 'Subjective', marks: 8, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'End Sem' }, bankId: 'q9' },
  { id: 'UPYQ-CS501-002', exam: 'University', year: '2024', session: 'Midsem', subject: 'CS501', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', chapter: 'Graph Algorithms', topic: 'MST (Kruskal/Prim)', question: 'Construct the MST of a given weighted graph using Kruskal and Prim algorithms and compare the edge sets.', options: ['Both always identical', 'Same total weight, possibly different edges', 'Always different weights', 'Undefined for negative edges'], answer: 'B', explanation: 'Both yield a minimum spanning tree — total weight equal, edge sets may differ.', difficulty: 'Medium', questionType: 'Subjective', marks: 6, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2024', session: 'Midsem' }, bankId: 'q10' },
  { id: 'UPYQ-CS501-003', exam: 'University', year: '2025', session: 'Midsem', subject: 'CS501', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', chapter: 'Dynamic Programming', topic: '0/1 Knapsack', question: 'Solve the 0/1 knapsack for 4 items with capacity 8 using a DP table and state the optimal value.', options: ['Greedy by weight', 'Greedy by value', 'DP table iteration', 'Random selection'], answer: 'C', explanation: 'DP explores all subsets efficiently in O(nW).', difficulty: 'Medium', questionType: 'Subjective', marks: 6, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'Midsem' }, bankId: 'q11' },
  { id: 'UPYQ-CS501-004', exam: 'University', year: '2024', session: 'End Sem', subject: 'CS501', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', chapter: 'Trees & Heaps', topic: 'AVL rotations', question: 'Insert nodes 10, 20, 30, 40, 50 into an AVL tree and show the rotations performed.', options: ['No rotations needed', 'Single then double rotation', 'Only single rotations', 'Only double rotations'], answer: 'B', explanation: 'Sequence forces a single rotation followed by a double rotation to restore balance.', difficulty: 'Medium', questionType: 'Subjective', marks: 5, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2024', session: 'End Sem' }, bankId: 'q12' },
  { id: 'UPYQ-CS501-005', exam: 'University', year: '2025', session: 'End Sem', subject: 'CS501', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', chapter: 'Complexity Analysis', topic: 'Big-O analysis', question: 'The recurrence T(n) = 2T(n/2) + n has which time complexity?', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: 'C', explanation: 'Master theorem case 2 → O(n log n).', difficulty: 'Easy', questionType: 'MCQ', marks: 2, negativeMarks: 0.5, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'End Sem' }, bankId: 'q13' },
  { id: 'UPYQ-CS503-001', exam: 'University', year: '2025', session: 'Midsem', subject: 'CS503', subjectCode: 'CS503', subjectName: 'Operating Systems', chapter: 'CPU Scheduling', topic: 'Scheduling policies', question: 'Compare SJF and Round Robin for a given process burst list and compute average waiting time for each.', options: ['SJF always lower', 'RR always lower', 'SJF minimises average waiting time here', 'They are equal'], answer: 'C', explanation: 'SJF minimises average waiting time among non-preemptive policies.', difficulty: 'Medium', questionType: 'Subjective', marks: 7, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'Midsem' }, bankId: 'q3' },
  { id: 'UPYQ-CS503-002', exam: 'University', year: '2024', session: 'End Sem', subject: 'CS503', subjectCode: 'CS503', subjectName: 'Operating Systems', chapter: 'Memory Management', topic: 'Paging & segmentation', question: 'Given a 4 KB page size and 32-bit addresses, compute the page-offset bits and the number of pages.', options: ['10 bits, 2²² pages', '12 bits, 2²⁰ pages', '12 bits, 2²² pages', '8 bits, 2²⁴ pages'], answer: 'B', explanation: 'Offset bits = log₂(4096) = 12; page count = 2^(32−12) = 2²⁰.', difficulty: 'Medium', questionType: 'Numerical', marks: 4, negativeMarks: 0.5, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2024', session: 'End Sem' }, bankId: 'q4' },
  { id: 'UPYQ-CS505-001', exam: 'University', year: '2025', session: 'Midsem', subject: 'CS505', subjectCode: 'CS505', subjectName: 'Machine Learning', chapter: 'Regression', topic: 'Ridge & Lasso', question: 'Ridge regression adds which penalty to the loss function?', options: ['L1 norm of weights', 'L2 norm of weights', 'L0 norm', 'No penalty'], answer: 'B', explanation: 'Ridge = L2 regularisation; Lasso = L1.', difficulty: 'Easy', questionType: 'MCQ', marks: 2, negativeMarks: 0.5, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'Midsem' }, bankId: 'q5' },
  { id: 'UPYQ-CS505-002', exam: 'University', year: '2024', session: 'End Sem', subject: 'CS505', subjectCode: 'CS505', subjectName: 'Machine Learning', chapter: 'Neural Networks', topic: 'Backpropagation', question: 'Explain vanishing gradients in deep networks and two mitigation techniques.', options: ['ReLU + batch normalisation', 'Sigmoid only', 'No solution exists', 'Smaller datasets'], answer: 'A', explanation: 'ReLU and batch norm/He-init reduce gradient vanishing.', difficulty: 'Medium', questionType: 'Subjective', marks: 6, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2024', session: 'End Sem' }, bankId: 'q8' },
  { id: 'UPYQ-CS506-001', exam: 'University', year: '2025', session: 'Midsem', subject: 'CS506', subjectCode: 'CS506', subjectName: 'Theory of Computation', chapter: 'Automata', topic: 'Pumping lemma', question: 'Use the pumping lemma to show that L = {aⁿbⁿ : n ≥ 1} is not regular.', options: ['It is regular', 'Pumping lemma disproves regularity', 'Undecidable', 'Trivially regular'], answer: 'B', explanation: 'Pumping a string out of the language violates closure for this non-regular language.', difficulty: 'Hard', questionType: 'Subjective', marks: 8, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'Midsem' }, bankId: null },
  { id: 'UPYQ-CS502-001', exam: 'University', year: '2024', session: 'End Sem', subject: 'CS502', subjectCode: 'CS502', subjectName: 'Database Management Systems', chapter: 'Relational Design', topic: 'Normalisation', question: 'Normalise the given relation to 3NF and justify each decomposition step.', options: ['Single table is fine', 'Decompose to remove transitive dependencies', 'Use denormalisation', 'No normal form applies'], answer: 'B', explanation: '3NF removes transitive functional dependencies via decomposition.', difficulty: 'Medium', questionType: 'Subjective', marks: 7, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2024', session: 'End Sem' }, bankId: null },
  { id: 'UPYQ-CS504-001', exam: 'University', year: '2025', session: 'End Sem', subject: 'CS504', subjectCode: 'CS504', subjectName: 'Computer Networks', chapter: 'Transport Layer', topic: 'TCP congestion control', question: 'Explain AIMD congestion control and sketch the sawtooth behaviour of cwnd over time.', options: ['Linear increase, halve on loss', 'Exponential always', 'Constant window', 'Random decrease'], answer: 'A', explanation: 'AIMD: additive increase, multiplicative (×½) decrease on loss.', difficulty: 'Medium', questionType: 'Subjective', marks: 6, negativeMarks: 0, source: 'demo', isPyq: true, pyq: { exam: 'University', year: '2025', session: 'End Sem' }, bankId: null },
]

export const competitiveQuestions = [...JEE_PHY, ...JEE_MAT, ...JEE_CHE, ...NEET_PHY, ...NEET_CHE, ...NEET_BIO]

export default { competitiveQuestions, universityPyqQuestions }
