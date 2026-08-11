/**
 * Faculty Assessment — AI QUESTION STUDIO · QUESTION DATASET (Phase 7).
 *
 * Deterministic, curated question pools bound to the 12 demo sources.
 * Every question is ORIGINAL demo content — syllabus-aligned, clearly
 * labelled, never presented as a real PYQ or textbook extract.
 *
 * Row format (positional):
 *   [topic, concept, subConcept, difficulty, qType, question, options,
 *    answerIndex, explanation, marks, negativeMarks, extra]
 * `extra` may carry { assertion, reason, diagram, caseText, matchPairs,
 * sequence } for structured question types. The builder stamps the full
 * metadata contract (questionId, sourceId, sourcePage, domain, exam,
 * subject, chapter, qualityScore defaults, reviewStatus…).
 */

const AR_OPTIONS = [
  'Both A and R are true and R is the correct explanation of A',
  'Both A and R are true but R is NOT the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
]

export function buildStudioPools({ sourceId, domain, exam, subject, chapter, rows }) {
  return rows.map((r, i) => {
    const [topic, concept, subConcept, difficulty, qType, question, options, answer, explanation, marks = 1, negativeMarks = 0, extra = {}] = r
    const id = `SQS-${sourceId.replace(/^SRC-/, '').replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`
    const isAR = qType === 'Assertion & Reason'
    const finalOptions = isAR ? AR_OPTIONS : options
    const finalQuestion = isAR && extra?.assertion ? `Assertion (A): ${extra.assertion}\nReason (R): ${extra.reason}` : question
    return {
      id,
      sourceId,
      domain,
      exam: exam ?? null,
      subject,
      chapter,
      topic,
      concept,
      subConcept: subConcept ?? null,
      difficulty,
      qType,
      question: finalQuestion,
      options: finalOptions,
      answer: isAR ? options[answer] ?? options[0] : options[answer] ?? null,
      answerIndex: isAR ? (options[answer] !== undefined ? answer : 0) : answer,
      explanation,
      marks,
      negativeMarks,
      diagram: extra?.diagram ?? null,
      caseText: extra?.caseText ?? null,
      matchPairs: extra?.matchPairs ?? null,
      sequence: extra?.sequence ?? null,
      sourcePage: 2 + ((i * 7) % 8), /* deterministic pseudo-page from the source content */
      sourceReference: `Page ${2 + ((i * 7) % 8)} · ${topic} · ${concept}`,
      /* bank-compatible type mapping (used when merged into the Question Bank) */
      type: qType === 'Assertion & Reason' ? 'Assertion Reason'
        : qType === 'Numerical' ? 'Numerical'
          : qType === 'Case Based' ? 'Case Based'
            : 'MCQ',
    }
  })
}

/* ================================================================== */
/* 1 · NEET Biology — Biomolecules (30)                                */
/* ================================================================== */
export const biomoleculesPool = buildStudioPools({
  sourceId: 'SRC-BIO-BIOMOL-001', domain: 'Competitive', exam: 'NEET UG', subject: 'Biology', chapter: 'Biomolecules',
  rows: [
    ['Carbohydrates', 'Monosaccharides', 'Hexoses', 'Easy', 'Direct MCQ', 'Which of the following is a monosaccharide with the formula C6H12O6?', ['Sucrose', 'Glucose', 'Starch', 'Cellulose'], 1, 'Glucose is a hexose monosaccharide; sucrose is a disaccharide and starch/cellulose are polysaccharides.'],
    ['Carbohydrates', 'Monosaccharides', 'Aldoses vs ketoses', 'Medium', 'Statement Based', 'Statement: Glucose and fructose are both reducing sugars. Which of the following is true?', ['True — both have a free carbonyl group in solution', 'True — only fructose is reducing', 'False — neither is reducing', 'False — only glucose is a hexose'], 0, 'Both glucose (aldose) and fructose (ketose) reduce Tollens/Fehling reagents because of interconversion in solution.'],
    ['Carbohydrates', 'Disaccharides', 'Glycosidic bonds', 'Easy', 'Direct MCQ', 'Sucrose is formed by the linkage of:', ['Glucose + glucose', 'Glucose + fructose', 'Glucose + galactose', 'Fructose + galactose'], 1, 'Sucrose = glucose + fructose joined by an α-1,2-glycosidic bond; it is a non-reducing sugar.'],
    ['Carbohydrates', 'Disaccharides', 'Reducing sugars', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Sucrose is a non-reducing sugar.', reason: 'Both anomeric carbons of glucose and fructose participate in the glycosidic bond.' }],
    ['Carbohydrates', 'Polysaccharides', 'Starch components', 'Medium', 'Multiple Statement', 'Which statements about starch are correct?\nI. Starch contains amylose and amylopectin.\nII. Amylose is unbranched.\nIII. Glycogen is more branched than starch.', ['I, II and III', 'I and II only', 'II and III only', 'I and III only'], 0, 'All three statements are correct properties of starch and glycogen.'],
    ['Carbohydrates', 'Polysaccharides', 'Cellulose', 'Easy', 'Direct MCQ', 'Cellulose differs from starch mainly because cellulose:', ['Has β-1,4 linkages between glucose units', 'Is a storage polysaccharide', 'Contains nitrogen', 'Is soluble in water'], 0, 'Cellulose is a structural polysaccharide with β-1,4-glucosidic linkages; most animals cannot digest it.'],
    ['Proteins', 'Amino Acids', 'Peptide bond formation', 'Easy', 'Direct MCQ', 'A peptide bond forms between:', ['Two amino groups', 'The α-carboxyl of one amino acid and α-amino of the next', 'Two R groups', 'A carboxyl and a hydroxyl'], 1, 'The peptide bond joins the carboxyl group of one amino acid to the amino group of the next with loss of water.'],
    ['Proteins', 'Amino Acids', 'Essential amino acids', 'Medium', 'Statement Based', 'Statement: Essential amino acids cannot be synthesised by the human body. This statement is:', ['True', 'False — all amino acids are synthesised', 'True only in infants', 'False — only vitamins are essential'], 0, 'Essential amino acids must be obtained from the diet because the body cannot synthesise them.'],
    ['Proteins', 'Protein Structure', 'Secondary structure', 'Medium', 'Direct MCQ', 'The α-helix and β-sheet are examples of which level of protein structure?', ['Primary', 'Secondary', 'Tertiary', 'Quaternary'], 1, 'Secondary structure arises from hydrogen bonding between backbone groups, forming α-helices and β-sheets.'],
    ['Proteins', 'Protein Structure', 'Tertiary structure', 'Medium', 'Multiple Statement', 'Which interactions stabilise tertiary structure?\nI. Disulphide bonds\nII. Hydrogen bonds\nIII. Hydrophobic interactions', ['I, II and III', 'I and II only', 'II and III only', 'I only'], 0, 'Tertiary structure is stabilised by disulphide, hydrogen, ionic and hydrophobic interactions.'],
    ['Proteins', 'Protein Structure', 'Denaturation', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 2, '', 1, 0, { assertion: 'Denaturation of a protein destroys its biological activity.', reason: 'Denaturation always breaks the peptide bonds of the primary structure.' }],
    ['Lipids', 'Fatty Acids', 'Saturation', 'Easy', 'Direct MCQ', 'An unsaturated fatty acid contains:', ['At least one C=C double bond', 'Only single bonds', 'A phosphate group', 'A peptide bond'], 0, 'Unsaturated fatty acids have one or more double bonds and generally lower melting points.'],
    ['Lipids', 'Glycerides', 'Triglycerides', 'Easy', 'Direct MCQ', 'A triglyceride is formed from:', ['Glycerol + three fatty acids', 'Glycerol + three amino acids', 'Three sugars + glycerol', 'Fatty acid + phosphate'], 0, 'Esterification of glycerol with three fatty acids yields a triglyceride — the main storage lipid.'],
    ['Lipids', 'Phospholipids', 'Bilayer', 'Medium', 'Application Based', 'Phospholipids form bilayers in water primarily because they:', ['Are amphipathic with polar heads and non-polar tails', 'Are completely hydrophobic', 'Contain proteins', 'Have high molecular weight'], 0, 'Amphipathic phospholipids orient polar heads to water and non-polar tails inward, forming the bilayer.'],
    ['Lipids', 'Glycerides', 'Energy density', 'Easy', 'Numerical', 'How many kcal per gram do fats provide, approximately?', ['4', '5', '7', '9'], 3, 'Fats provide about 9 kcal/g, versus 4 kcal/g for carbohydrates and proteins.'],
    ['Enzymes', 'Enzyme Activity', 'Active site', 'Easy', 'Direct MCQ', 'The region of an enzyme where the substrate binds is called the:', ['Active site', 'Allosteric site', 'Ribosome', 'Cofactor'], 0, 'The active site is a specific pocket that binds the substrate and catalyses the reaction.'],
    ['Enzymes', 'Enzyme Activity', 'Activation energy', 'Medium', 'Statement Based', 'Statement: Enzymes lower the activation energy of a reaction. This means enzymes:', ['Speed up the reaction without being consumed', 'Change the equilibrium constant', 'Are consumed in the reaction', 'Only work on inorganic substrates'], 0, 'Enzymes lower activation energy and are not consumed; they do not change equilibrium.'],
    ['Enzymes', 'Factors Affecting Enzyme Activity', 'Temperature', 'Medium', 'Application Based', 'Salivary amylase activity rises with temperature up to about 37 °C and then falls sharply. This is because:', ['High temperature denatures the enzyme', 'Substrate becomes insoluble', 'The pH changes', 'The enzyme is inhibited by products'], 0, 'Beyond the optimum temperature, thermal denaturation destroys the enzyme\u2019s active site.'],
    ['Enzymes', 'Factors Affecting Enzyme Activity', 'pH optima', 'Medium', 'Match the Following', 'Match the enzyme with its optimal pH environment:\nList-I: (1) Pepsin (2) Salivary amylase (3) Trypsin\nList-II: (A) Stomach (acidic) (B) Mouth (near neutral) (C) Small intestine (alkaline)', ['1-A, 2-B, 3-C', '1-B, 2-A, 3-C', '1-C, 2-B, 3-A', '1-A, 2-C, 3-B'], 0, 'Pepsin works in the acidic stomach, salivary amylase near neutral pH in the mouth, and trypsin in the alkaline small intestine.'],
    ['Enzymes', 'Inhibitors', 'Competitive inhibition', 'Medium', 'Application Based', 'Competitive inhibition of an enzyme can be overcome by:', ['Increasing substrate concentration', 'Decreasing temperature', 'Adding more inhibitor', 'Changing pH alone'], 0, 'A high substrate concentration outcompetes a competitive inhibitor for the active site.'],
    ['Enzymes', 'Inhibitors', 'Non-competitive inhibition', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 1, '', 1, 0, { assertion: 'Non-competitive inhibition cannot be overcome by raising substrate concentration.', reason: 'The inhibitor binds at a site other than the active site and changes enzyme shape.' }],
    ['Enzymes', 'Inhibitors', 'Feedback inhibition', 'Medium', 'Statement Based', 'Statement: In feedback inhibition, the end product of a pathway inhibits an early enzyme. This statement is:', ['True — it regulates metabolic pathways', 'False — the first substrate inhibits', 'True — only in bacteria', 'False — inhibition is always competitive'], 0, 'Feedback (end-product) inhibition controls biosynthetic pathways by inhibiting the first committed enzyme.'],
    ['Enzymes', 'Enzyme Activity', 'Cofactors', 'Easy', 'Direct MCQ', 'Metal ions that assist enzyme activity are called:', ['Co-factors', 'Substrates', 'Inhibitors', 'Isoenzymes'], 0, 'Co-factors (metal ions) and co-enzymes (organic molecules) assist enzyme catalysis.'],
    ['Enzymes', 'Factors Affecting Enzyme Activity', 'Substrate concentration', 'Medium', 'Application Based', 'At very high substrate concentration, the reaction rate of an enzyme-catalysed reaction:', ['Plateaus as enzymes become saturated', 'Keeps increasing linearly', 'Drops to zero', 'Becomes independent of enzyme amount'], 0, 'At saturation, all active sites are occupied and the rate depends on enzyme concentration, not substrate.'],
    ['Carbohydrates', 'Monosaccharides', 'Blood glucose', 'Medium', 'Application Based', 'After a carbohydrate-rich meal, blood glucose rises and insulin is released. Insulin primarily:', ['Promotes glucose uptake and glycogen storage', 'Breaks down glycogen to glucose', 'Stops all metabolism', 'Converts glucose to cellulose'], 0, 'Insulin promotes glucose uptake by cells and glycogen synthesis, lowering blood glucose.'],
    ['Carbohydrates', 'Polysaccharides', 'Dietary fibre', 'Easy', 'Statement Based', 'Statement: Dietary cellulose helps bowel movement but provides almost no energy to humans. This statement is:', ['True — humans lack cellulase', 'False — cellulose is digested to glucose', 'True — cellulose is a protein', 'False — cellulose is a vitamin'], 0, 'Humans lack cellulase, so cellulose passes largely undigested as dietary fibre.'],
    ['Proteins', 'Amino Acids', 'Zwitterion', 'Medium', 'Direct MCQ', 'At its isoelectric point, an amino acid exists mainly as:', ['A zwitterion with net zero charge', 'A positive ion', 'A negative ion', 'An uncharged non-polar molecule'], 0, 'At the isoelectric pH, the amino acid is a zwitterion with equal positive and negative charges.'],
    ['Lipids', 'Phospholipids', 'Membrane role', 'Medium', 'Application Based', 'The amphipathic nature of phospholipids is most directly responsible for:', ['Formation of the cell membrane bilayer', 'Storing genetic information', 'Catalysing reactions', 'Transporting oxygen'], 0, 'Amphipathic phospholipids self-assemble into the bilayer that forms the cell membrane.'],
    ['Enzymes', 'Enzyme Activity', 'Lock and key', 'Medium', 'Statement Based', 'Statement: According to the lock-and-key model, the substrate fits the active site like a key fits a lock. This statement is:', ['True — a useful simplified model', 'False — enzymes are rigid always', 'True — only for lipases', 'False — substrates never bind enzymes'], 0, 'The lock-and-key model describes complementary fitting; the induced-fit model is a refinement.'],
    ['Carbohydrates', 'Disaccharides', 'Lactose', 'Easy', 'Direct MCQ', 'Lactose on hydrolysis yields:', ['Glucose + galactose', 'Glucose + fructose', 'Two glucose units', 'Fructose + galactose'], 0, 'Lactose = glucose + galactose; maltose gives two glucose units and sucrose gives glucose + fructose.'],
  ],
})

/* ================================================================== */
/* 2 · NEET Biology — Digestion & Absorption (25)                      */
/* ================================================================== */
export const digestionPool = buildStudioPools({
  sourceId: 'SRC-BIO-DIGEST-002', domain: 'Competitive', exam: 'NEET UG', subject: 'Biology', chapter: 'Digestion & Absorption',
  rows: [
    ['Alimentary Canal', 'Oral Cavity', 'Teeth', 'Easy', 'Direct MCQ', 'The process of chewing food into smaller pieces is called:', ['Mastication', 'Peristalsis', 'Deglutition', 'Emulsification'], 0, 'Mastication (chewing) increases surface area for enzyme action.'],
    ['Alimentary Canal', 'Oral Cavity', 'Salivary glands', 'Easy', 'Match the Following', 'Match the salivary gland with its description:\nList-I: (1) Parotid (2) Submaxillary (3) Sublingual\nList-II: (A) Below the tongue (B) Below the jaw (C) Near the ear', ['1-C, 2-B, 3-A', '1-A, 2-B, 3-C', '1-B, 2-A, 3-C', '1-C, 2-A, 3-B'], 0, 'Parotid is near the ear, submaxillary below the jaw, and sublingual below the tongue.'],
    ['Digestive Glands', 'Salivary Glands', 'Saliva enzymes', 'Easy', 'Direct MCQ', 'Salivary amylase begins the digestion of:', ['Starch', 'Proteins', 'Fats', 'Cellulose'], 0, 'Salivary amylase (ptyalin) hydrolyses starch into maltose in the mouth.'],
    ['Alimentary Canal', 'Stomach', 'Gastric juice', 'Medium', 'Statement Based', 'Statement: HCl in the stomach activates pepsinogen to pepsin. This statement is:', ['True', 'False — pepsinogen is activated by bile', 'True — and HCl is secreted by the liver', 'False — pepsin is not a proteinase'], 0, 'Gastric HCl converts inactive pepsinogen into active pepsin, which digests proteins.'],
    ['Alimentary Canal', 'Stomach', 'Mucus role', 'Medium', 'Application Based', 'The stomach lining is protected from self-digestion mainly by:', ['Mucus secretion', 'High pH', 'Absence of enzymes', 'Rapid cell turnover only'], 0, 'Mucus forms a protective barrier between gastric juice and the stomach wall.'],
    ['Digestive Glands', 'Pancreas', 'Pancreatic juice', 'Medium', 'Multiple Statement', 'Which are components of pancreatic juice?\nI. Trypsinogen\nII. Pancreatic amylase\nIII. Lipase', ['I, II and III', 'I and II only', 'II and III only', 'I only'], 0, 'Pancreatic juice contains trypsinogen, chymotrypsinogen, amylase, lipase and nucleases.'],
    ['Digestive Glands', 'Pancreas', 'Enterokinase', 'Medium', 'Direct MCQ', 'Trypsinogen is activated to trypsin by:', ['Enterokinase', 'Pepsin', 'HCl alone', 'Bile salts'], 0, 'Enterokinase, secreted by the intestinal mucosa, activates trypsinogen.'],
    ['Digestive Glands', 'Liver', 'Bile', 'Easy', 'Direct MCQ', 'Bile is produced by the:', ['Liver', 'Gallbladder', 'Pancreas', 'Stomach'], 0, 'The liver produces bile; the gallbladder stores and concentrates it.'],
    ['Digestive Glands', 'Liver', 'Emulsification', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Bile helps in the digestion of fats.', reason: 'Bile salts emulsify fats, increasing the surface area for lipase action.' }],
    ['Digestive Glands', 'Liver', 'Bile enzymes', 'Medium', 'Statement Based', 'Statement: Bile contains digestive enzymes. This statement is:', ['False — bile contains bile salts and pigments but no enzymes', 'True — bile contains lipase', 'True — bile contains pepsin', 'False — bile is a waste product only'], 0, 'Bile has no enzymes; it emulsifies fats with bile salts.'],
    ['Digestive Enzymes', 'Amylases', 'Starch breakdown', 'Medium', 'Application Based', 'Starch is completely digested to glucose by the combined action of:', ['Salivary amylase + intestinal maltase', 'Pepsin + HCl', 'Lipase + bile', 'Trypsin + chymotrypsin'], 0, 'Amylases produce maltose, and maltase converts maltose to glucose.'],
    ['Digestive Enzymes', 'Proteases', 'Protein digestion', 'Medium', 'Sequence / Arrangement', 'Arrange protein digestion in correct order:\nI. Pepsin action in stomach\nII. Trypsin in small intestine\nIII. Peptidases to amino acids', ['I → II → III', 'II → I → III', 'III → II → I', 'I → III → II'], 0, 'Pepsin starts in the stomach, trypsin continues in the intestine, and peptidases complete the process.'],
    ['Digestive Enzymes', 'Lipases', 'Fat digestion', 'Medium', 'Application Based', 'Fat digestion mainly occurs in the:', ['Small intestine with bile + pancreatic lipase', 'Stomach', 'Mouth', 'Large intestine'], 0, 'Emulsified fats are digested by pancreatic lipase in the small intestine.'],
    ['Absorption', 'Villi', 'Surface area', 'Easy', 'Direct MCQ', 'The finger-like projections lining the small intestine are called:', ['Villi', 'Alveoli', 'Nephrons', 'Cilia'], 0, 'Villi and microvilli vastly increase the absorptive surface of the small intestine.'],
    ['Absorption', 'Absorption Sites', 'Nutrient uptake', 'Medium', 'Match the Following', 'Match the nutrient with its absorption route:\nList-I: (1) Glucose (2) Amino acids (3) Fatty acids\nList-II: (A) Blood capillaries (B) Lacteals (C) Blood capillaries', ['1-A, 2-C, 3-B', '1-B, 2-A, 3-C', '1-C, 2-B, 3-A', '1-A, 2-B, 3-B'], 0, 'Monosaccharides and amino acids enter blood capillaries; fatty acids and glycerol enter lacteals as chylomicrons.'],
    ['Absorption', 'Absorption Sites', 'Active transport', 'Medium', 'Statement Based', 'Statement: Glucose and amino acids are absorbed by active transport. This statement is:', ['True — they are absorbed against a concentration gradient', 'False — all absorption is passive', 'True — only in the large intestine', 'False — they are absorbed by pinocytosis'], 0, 'Glucose and amino acids use active transport carriers in the small intestine.'],
    ['Absorption', 'Water Absorption', 'Main site', 'Medium', 'Direct MCQ', 'Most water absorption occurs in the:', ['Large intestine', 'Stomach', 'Mouth', 'Oesophagus'], 0, 'The large intestine absorbs most of the remaining water, forming faeces.'],
    ['Alimentary Canal', 'Small Intestine', 'Main digestion site', 'Easy', 'Direct MCQ', 'The principal site of digestion and absorption in humans is the:', ['Small intestine', 'Stomach', 'Large intestine', 'Rectum'], 0, 'The small intestine (duodenum, jejunum, ileum) is the main site of digestion and absorption.'],
    ['Digestive Glands', 'Liver', 'Fat-soluble vitamins', 'Medium', 'Application Based', 'Impaired bile secretion would most directly reduce absorption of:', ['Vitamins A, D, E and K', 'Vitamin C only', 'All B vitamins', 'Glucose'], 0, 'Bile salts are needed to absorb fat-soluble vitamins A, D, E and K.'],
    ['Digestive Enzymes', 'Proteases', 'Gastric lipase', 'Medium', 'Statement Based', 'Statement: Gastric lipase is the major enzyme of fat digestion in adults. This statement is:', ['False — most fat digestion occurs in the small intestine', 'True', 'True — gastric lipase is very abundant', 'False — bile digests fats directly'], 0, 'Gastric lipase has a minor role in adults; pancreatic lipase dominates fat digestion.'],
    ['Alimentary Canal', 'Large Intestine', 'Bacterial role', 'Medium', 'Application Based', 'Bacteria in the large intestine are useful because they:', ['Synthesise some vitamins (e.g., B and K)', 'Digest cellulose into glucose', 'Secrete bile', 'Activate pepsin'], 0, 'Gut bacteria synthesise some vitamins (B12, K) and ferment undigested fibre.'],
    ['Digestive Glands', 'Salivary Glands', 'Lysozyme', 'Medium', 'Direct MCQ', 'Lysozyme present in saliva is:', ['Antibacterial', 'A protease', 'A carbohydrate', 'A bile salt'], 0, 'Lysozyme is an enzyme with antibacterial action, part of innate immunity.'],
    ['Alimentary Canal', 'Oesophagus', 'Deglutition', 'Easy', 'Direct MCQ', 'The wave-like muscular contractions that move food through the alimentary canal are called:', ['Peristalsis', 'Emulsification', 'Diffusion', 'Osmosis'], 0, 'Peristalsis — rhythmic contraction waves — propels food along the canal.'],
    ['Digestive Enzymes', 'Amylases', 'Maltose product', 'Easy', 'Direct MCQ', 'Maltose on complete digestion gives:', ['Two glucose units', 'Glucose + fructose', 'Glucose + galactose', 'Fructose only'], 0, 'Maltase hydrolyses maltose into two molecules of glucose.'],
    ['Absorption', 'Villi', 'Lacteals', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Fatty acids and glycerol are absorbed into lacteals.', reason: 'Lacteals are lymphatic capillaries inside the villi that transport chylomicrons.' }],
  ],
})

/* ================================================================== */
/* 3 · JEE + NEET Physics — Laws of Motion (30)                        */
/* ================================================================== */
export const lawsOfMotionPool = buildStudioPools({
  sourceId: 'SRC-PHY-LAWS-003', domain: 'Competitive', exam: 'JEE Main + NEET UG', subject: 'Physics', chapter: 'Laws of Motion',
  rows: [
    ['Newton\u2019s Laws', 'First Law', 'Inertia', 'Easy', 'Direct MCQ', 'Newton\u2019s first law of motion defines:', ['Inertia', 'Momentum', 'Impulse', 'Acceleration'], 0, 'The first law states that bodies resist changes to their state of motion — the property of inertia.'],
    ['Newton\u2019s Laws', 'Second Law', 'Force equation', 'Easy', 'Direct MCQ', 'For constant mass, Newton\u2019s second law is:', ['F = ma', 'F = mv', 'F = m/a', 'F = a/m'], 0, 'F = ma; more generally F = dp/dt.'],
    ['Newton\u2019s Laws', 'Second Law', 'Momentum', 'Medium', 'Numerical', 'A 2 kg body moving at 5 m/s has a momentum of:', ['10 kg·m/s', '5 kg·m/s', '2.5 kg·m/s', '20 kg·m/s'], 0, 'p = mv = 2 × 5 = 10 kg·m/s.'],
    ['Newton\u2019s Laws', 'Second Law', 'Impulse', 'Medium', 'Numerical', 'A force of 10 N acts for 3 s on a body. The impulse delivered is:', ['30 N·s', '10 N·s', '3 N·s', '13 N·s'], 0, 'Impulse = F·Δt = 10 × 3 = 30 N·s, equal to the change in momentum.'],
    ['Newton\u2019s Laws', 'Third Law', 'Action-reaction', 'Easy', 'Direct MCQ', 'Action and reaction forces:', ['Act on different bodies', 'Act on the same body', 'Always cancel each other', 'Act only during contact'], 0, 'Action–reaction pairs act on two different bodies, so they never cancel.'],
    ['Newton\u2019s Laws', 'Third Law', 'Rocket propulsion', 'Medium', 'Application Based', 'A rocket moves forward because:', ['Exhaust gases push the rocket and the rocket pushes the gases (third law)', 'The rocket pushes air behind it only', 'Gravity pulls it', 'The exhaust heats the ground'], 0, 'The rocket expels gases downward; the reaction pushes the rocket upward — no air is needed in space.'],
    ['Newton\u2019s Laws', 'Second Law', 'Free body diagram', 'Medium', 'Diagram Based', 'A block of mass 5 kg rests on a horizontal floor (g = 10 m/s²). In its free-body diagram, the normal force equals:', ['50 N upward', '50 N downward', '5 N upward', '25 N upward'], 0, 'For a block at rest, N = mg = 50 N upward, balancing weight.'],
    ['Friction', 'Static Friction', 'Maximum value', 'Medium', 'Numerical', 'A 4 kg block on a horizontal surface has μs = 0.5 (g = 10 m/s²). The maximum static friction is:', ['20 N', '10 N', '40 N', '5 N'], 0, 'f_s(max) = μs·N = 0.5 × 40 = 20 N.'],
    ['Friction', 'Static Friction', 'Self-adjusting', 'Medium', 'Statement Based', 'Statement: Static friction is self-adjusting up to a maximum value. This statement is:', ['True', 'False — it is constant', 'True — only on inclined planes', 'False — it depends on velocity'], 0, 'Static friction adjusts to balance applied force until the limiting value μsN is reached.'],
    ['Friction', 'Kinetic Friction', 'Relation with static', 'Easy', 'Direct MCQ', 'For a given pair of surfaces, generally:', ['μk < μs', 'μk > μs', 'μk = μs', 'μk is always zero'], 0, 'Kinetic friction is typically slightly less than the maximum static friction.'],
    ['Friction', 'Angle of Repose', 'Definition', 'Medium', 'Direct MCQ', 'The angle of repose θ satisfies:', ['tan θ = μs', 'sin θ = μs', 'cos θ = μs', 'tan θ = μk/2'], 0, 'A body just begins to slide when tan θ = μs on an incline.'],
    ['Friction', 'Kinetic Friction', 'Contact area', 'Medium', 'Statement Based', 'Statement: Kinetic friction depends on the area of contact. This statement is:', ['False — friction is largely independent of contact area', 'True — larger area means more friction', 'True — for all materials', 'False — friction never exists'], 0, 'For moderate pressures, friction depends on normal force and materials, not area.'],
    ['Circular Motion', 'Centripetal Force', 'Required force', 'Easy', 'Direct MCQ', 'A body of mass m moving with speed v in a circle of radius r needs a centripetal force of:', ['mv²/r', 'mv/r', 'mr/v', 'mv²r'], 0, 'Centripetal force = mv²/r directed toward the centre.'],
    ['Circular Motion', 'Centripetal Force', 'Work done', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Centripetal force does no work on a body in uniform circular motion.', reason: 'Centripetal force is always perpendicular to the instantaneous displacement.' }],
    ['Circular Motion', 'Banking of Roads', 'Ideal banking', 'Medium', 'Numerical', 'For a road banked at angle θ with speed v and radius r, the ideal banking condition (no friction needed) is:', ['tan θ = v²/(rg)', 'sin θ = v²/(rg)', 'tan θ = vg/r', 'cos θ = v²/(rg)'], 0, 'Ideal banking: tan θ = v²/(rg).'],
    ['Circular Motion', 'Conical Pendulum', 'Time period', 'Medium', 'Numerical', 'A car takes a turn of radius 50 m at 20 m/s on a flat road. If μs = 0.8 and g = 10 m/s², will it skid?', ['No — required friction is below the limit', 'Yes — required friction exceeds the limit', 'It depends on mass', 'Only in rain'], 0, 'Required centripetal force = mv²/r = 8m; available friction = μsmg = 8m — exactly at the limit, so it just manages (no skid).'],
    ['Circular Motion', 'Vertical circle', 'Minimum speed', 'Hard', 'Numerical', 'A body tied to a string moves in a vertical circle of radius r. The minimum speed at the top for the string to stay taut is:', ['√(gr)', '√(2gr)', '√(3gr)', '2√(gr)'], 0, 'At the top, mg provides the centripetal force at minimum speed: v_min = √(gr).'],
    ['Pseudo Forces', 'Non-inertial Frames', 'Lift problems', 'Medium', 'Application Based', 'A lift accelerates upward with acceleration a. The apparent weight of a person of mass m is:', ['m(g + a)', 'm(g − a)', 'mg', 'ma'], 0, 'In the accelerating frame, the apparent weight is m(g + a) when accelerating upward.'],
    ['Pseudo Forces', 'Non-inertial Frames', 'Free fall', 'Medium', 'Direct MCQ', 'In a freely falling lift, the apparent weight of a passenger is:', ['Zero', 'mg', '2mg', 'mg/2'], 0, 'In free fall a = g downward, so apparent weight = m(g − g) = 0.'],
    ['Pseudo Forces', 'Inertial Frames', 'Validity', 'Medium', 'Statement Based', 'Statement: Newton\u2019s laws hold directly only in inertial frames. This statement is:', ['True — pseudo forces are needed in accelerating frames', 'False — they hold in all frames', 'True — only for projectiles', 'False — only for fluids'], 0, 'In non-inertial frames, pseudo forces must be introduced to apply Newton\u2019s laws.'],
    ['Pseudo Forces', 'Lift Problems', 'Downward acceleration', 'Medium', 'Numerical', 'A 60 kg person stands in a lift accelerating downward at 2 m/s² (g = 10). The normal reaction is:', ['480 N', '600 N', '720 N', '120 N'], 0, 'N = m(g − a) = 60 × 8 = 480 N.'],
    ['Newton\u2019s Laws', 'Second Law', 'Connected bodies', 'Medium', 'Application Based', 'Two masses 3 kg and 1 kg hang over a frictionless pulley (g = 10). The acceleration is:', ['5 m/s²', '2.5 m/s²', '10 m/s²', '7.5 m/s²'], 0, 'a = (m1 − m2)g/(m1 + m2) = (2 × 10)/4 = 5 m/s².'],
    ['Newton\u2019s Laws', 'Second Law', 'Pulley tension', 'Medium', 'Numerical', 'For the 3 kg and 1 kg masses over a pulley (g = 10), the tension in the string is:', ['15 N', '10 N', '20 N', '30 N'], 0, 'T = 2m1m2g/(m1 + m2) = 2×3×1×10/4 = 15 N.'],
    ['Friction', 'Static Friction', 'Incline', 'Medium', 'Numerical', 'A block just begins to slide on an incline at 30°. The coefficient of static friction is:', ['tan 30° ≈ 0.58', 'sin 30° = 0.5', 'cos 30° ≈ 0.87', '1'], 0, 'At the point of sliding, μs = tan θ = tan 30° ≈ 0.58.'],
    ['Circular Motion', 'Centripetal Force', 'Banked track', 'Hard', 'Numerical', 'A cyclist banks at angle θ while turning on a horizontal circular track. The relation at correct banking is:', ['tan θ = v²/(rg)', 'N = mg cos θ', 'f = μN always', 'v = √(2gh)'], 0, 'Correct banking satisfies tan θ = v²/(rg).'],
    ['Newton\u2019s Laws', 'First Law', 'Constant velocity', 'Easy', 'Application Based', 'A car moves on a straight road at a constant velocity of 20 m/s. The net force on the car is:', ['Zero', 'mg', '20 N', 'mv'], 0, 'Constant velocity means zero acceleration, hence zero net force.'],
    ['Newton\u2019s Laws', 'Third Law', 'Normal vs weight', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 1, '', 1, 0, { assertion: 'The normal force on a block equals its weight when at rest on a floor.', reason: 'Normal force and weight are an action–reaction pair.' }],
    ['Friction', 'Rolling Friction', 'Comparison', 'Easy', 'Direct MCQ', 'Compared with sliding friction, rolling friction is:', ['Much smaller', 'Larger', 'Equal', 'Zero always'], 0, 'Rolling friction is much smaller than sliding friction, which is why wheels are used.'],
    ['Pseudo Forces', 'Non-inertial Frames', 'Accelerating trolley', 'Medium', 'Application Based', 'A block rests on a smooth trolley accelerating at 2 m/s². To an observer on the trolley, the block appears at rest because of:', ['A pseudo force −ma on the block', 'Friction', 'Gravity', 'The normal force'], 0, 'In the trolley frame, a pseudo force −ma balances the block\u2019s inertia, so it appears at rest.'],
    ['Circular Motion', 'Centripetal Force', 'Car on flat road', 'Medium', 'Application Based', 'On a flat circular road, the centripetal force for a turning car is supplied by:', ['Friction between tyres and road', 'The engine', 'Air resistance', 'The normal force'], 0, 'Friction provides the centripetal force; if it is insufficient, the car skids outward.'],
  ],
})


/* ================================================================== */
/* 4 · JEE + NEET Physics — Work, Energy & Power (25)                  */
/* ================================================================== */
export const workEnergyPowerPool = buildStudioPools({
  sourceId: 'SRC-PHY-WEP-004', domain: 'Competitive', exam: 'JEE Main + NEET UG', subject: 'Physics', chapter: 'Work, Energy & Power',
  rows: [
    ['Work', 'Work by Constant Force', 'Definition', 'Easy', 'Direct MCQ', 'Work done by a constant force F over displacement d is:', ['W = Fd cos θ', 'W = Fd sin θ', 'W = F/d', 'W = mgh'], 0, 'W = F·d = Fd cos θ, where θ is the angle between force and displacement.'],
    ['Work', 'Work by Constant Force', 'Zero work', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Centripetal force does no work in uniform circular motion.', reason: 'The force is perpendicular to the displacement at every instant.' }],
    ['Work', 'Work by Constant Force', 'Negative work', 'Easy', 'Application Based', 'A body slides on a rough floor and stops. The work done by friction is:', ['Negative', 'Positive', 'Zero', 'Infinite'], 0, 'Friction opposes displacement, so its work is negative.'],
    ['Work', 'Work by Constant Force', 'Gravity on horizontal path', 'Medium', 'Statement Based', 'Statement: Gravity does no work on a body moving horizontally at constant height. This statement is:', ['True — the displacement is perpendicular to gravity', 'False — gravity always does work', 'True — only in vacuum', 'False — work is always mgh'], 0, 'For horizontal motion, θ = 90° between gravity and displacement, so W = 0.'],
    ['Work', 'Work by Variable Force', 'Spring work', 'Medium', 'Numerical', 'A spring of constant k = 100 N/m is stretched by 0.1 m. The work done is:', ['0.5 J', '1 J', '10 J', '5 J'], 0, 'W = ½kx² = ½ × 100 × 0.01 = 0.5 J.'],
    ['Work', 'Work by Variable Force', 'Area under F–x', 'Medium', 'Direct MCQ', 'Work done by a variable force equals:', ['The area under the F–x graph', 'The slope of the F–x graph', 'F × x always', '½mv²'], 0, 'Work = ∫F dx, the area under the force–displacement curve.'],
    ['Energy', 'Kinetic Energy', 'Formula', 'Easy', 'Direct MCQ', 'The kinetic energy of a body of mass m moving with speed v is:', ['½mv²', 'mv²', 'mv', '½mv'], 0, 'K = ½mv².'],
    ['Energy', 'Kinetic Energy', 'Doubling speed', 'Easy', 'Numerical', 'If the speed of a body is doubled, its kinetic energy becomes:', ['4 times', '2 times', '8 times', '1.41 times'], 0, 'K ∝ v², so doubling speed quadruples kinetic energy.'],
    ['Energy', 'Work–Energy Theorem', 'Statement', 'Medium', 'Direct MCQ', 'The work–energy theorem states that the net work done on a body equals its:', ['Change in kinetic energy', 'Change in potential energy', 'Total energy', 'Momentum'], 0, 'W_net = ΔK = ½mv² − ½mu².'],
    ['Energy', 'Work–Energy Theorem', 'Braking', 'Medium', 'Application Based', 'A car of mass 1000 kg moving at 20 m/s is stopped by brakes. The work done by the brakes is:', ['−200 kJ', '−20 kJ', '200 kJ', '−400 kJ'], 0, 'W = 0 − ½ × 1000 × 400 = −200 kJ.'],
    ['Energy', 'Potential Energy', 'Gravitational PE', 'Easy', 'Numerical', 'A 5 kg body is raised by 2 m (g = 10). Its gain in potential energy is:', ['100 J', '50 J', '10 J', '200 J'], 0, 'ΔU = mgh = 5 × 10 × 2 = 100 J.'],
    ['Energy', 'Potential Energy', 'Spring PE', 'Easy', 'Direct MCQ', 'Elastic potential energy stored in a spring of constant k stretched by x is:', ['½kx²', 'kx²', '½kx', 'k/x'], 0, 'U = ½kx².'],
    ['Energy', 'Potential Energy', 'Conservative forces', 'Medium', 'Statement Based', 'Statement: Work done by a conservative force around a closed loop is zero. This statement is:', ['True', 'False — it is maximum', 'True — only for friction', 'False — only in space'], 0, 'Conservative force work is path-independent, so around a closed loop it is zero.'],
    ['Energy', 'Potential Energy', 'Friction non-conservative', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Mechanical energy is not conserved when friction acts.', reason: 'Friction is a non-conservative force that dissipates mechanical energy as heat.' }],
    ['Power', 'Average Power', 'Definition', 'Easy', 'Direct MCQ', 'Average power is defined as:', ['Work per unit time', 'Force per unit time', 'Energy per unit distance', 'Momentum per unit time'], 0, 'P_avg = W/t, measured in watts.'],
    ['Power', 'Instantaneous Power', 'F·v', 'Medium', 'Direct MCQ', 'Instantaneous power delivered by a force F to a body moving with velocity v is:', ['F·v', 'F/v', 'F × t', 'mv'], 0, 'P = dW/dt = F·v.'],
    ['Power', 'Average Power', 'Lifting pump', 'Medium', 'Numerical', 'A pump lifts 200 kg of water to a height of 10 m in 20 s (g = 10). Its output power is:', ['1000 W', '500 W', '2000 W', '4000 W'], 0, 'P = mgh/t = 200 × 10 × 10/20 = 1000 W.'],
    ['Power', 'Average Power', 'hp conversion', 'Easy', 'Direct MCQ', 'One horsepower equals approximately:', ['746 W', '1000 W', '100 W', '746 J'], 0, '1 hp ≈ 746 W.'],
    ['Collisions', 'Elastic Collisions', 'Equal masses', 'Medium', 'Application Based', 'In a head-on elastic collision of two equal masses, one at rest, after collision:', ['Velocities are exchanged', 'Both stop', 'Both move at half speed', 'The moving mass reverses at double speed'], 0, 'For equal masses in a head-on elastic collision, the velocities are exchanged.'],
    ['Collisions', 'Elastic Collisions', 'Conservation', 'Medium', 'Statement Based', 'Statement: In an elastic collision both momentum and kinetic energy are conserved. This statement is:', ['True', 'False — only momentum is conserved', 'True — only in 2-D', 'False — energy is always lost'], 0, 'Elastic collisions conserve both momentum and kinetic energy.'],
    ['Collisions', 'Inelastic Collisions', 'Perfectly inelastic', 'Medium', 'Direct MCQ', 'In a perfectly inelastic collision:', ['Bodies stick together and maximum kinetic energy is lost', 'Kinetic energy is conserved', 'Momentum is not conserved', 'Bodies rebound elastically'], 0, 'Perfectly inelastic collisions have e = 0: bodies move together with maximum KE loss.'],
    ['Collisions', 'Inelastic Collisions', 'Coefficient of restitution', 'Medium', 'Direct MCQ', 'The coefficient of restitution for a perfectly inelastic collision is:', ['0', '1', '0.5', '2'], 0, 'e = 0 means no separation velocity — bodies stick together.'],
    ['Collisions', 'Inelastic Collisions', 'Sticking masses', 'Medium', 'Numerical', 'A 2 kg body moving at 6 m/s collides perfectly inelastically with a 4 kg body at rest. The combined speed is:', ['2 m/s', '3 m/s', '4 m/s', '6 m/s'], 0, 'Conserving momentum: 2×6 = 6×v → v = 2 m/s.'],
    ['Collisions', 'Inelastic Collisions', 'Energy loss', 'Hard', 'Numerical', 'For the 2 kg at 6 m/s colliding with the 4 kg at rest (perfectly inelastic), the kinetic energy lost is:', ['24 J', '12 J', '36 J', '6 J'], 0, 'Initial K = ½×2×36 = 36 J; final K = ½×6×4 = 12 J; loss = 24 J.'],
    ['Work', 'Work by Constant Force', 'Lifting vertically', 'Easy', 'Application Based', 'The work done in lifting a 10 kg box through 3 m at constant speed (g = 10) is:', ['300 J', '30 J', '100 J', '600 J'], 0, 'W = mgh = 10 × 10 × 3 = 300 J (force equals weight at constant speed).'],
  ],
})

/* ================================================================== */
/* 5 · JEE + NEET Chemistry — Chemical Bonding (30)                    */
/* ================================================================== */
export const chemicalBondingPool = buildStudioPools({
  sourceId: 'SRC-CHE-BOND-005', domain: 'Competitive', exam: 'JEE Main + NEET UG', subject: 'Chemistry', chapter: 'Chemical Bonding & Molecular Structure',
  rows: [
    ['Bond Types', 'Ionic Bond', 'Formation', 'Easy', 'Direct MCQ', 'An ionic bond is formed by:', ['Complete transfer of electrons', 'Sharing of electron pairs', 'Delocalisation of π-electrons', 'Hydrogen bonding'], 0, 'Ionic bonds form by electron transfer between atoms of very different electronegativity.'],
    ['Bond Types', 'Ionic Bond', 'Lattice energy', 'Medium', 'Statement Based', 'Statement: The stability of an ionic crystal depends on its lattice energy. This statement is:', ['True — higher lattice energy means greater stability', 'False — lattice energy is irrelevant', 'True — only for covalent solids', 'False — all crystals have equal energy'], 0, 'Lattice energy measures the strength of the ionic lattice; larger values indicate greater stability.'],
    ['Bond Types', 'Covalent Bond', 'Sharing', 'Easy', 'Direct MCQ', 'A covalent bond forms when atoms:', ['Share electron pairs', 'Transfer electrons completely', 'Lose protons', 'Merge nuclei'], 0, 'Covalent bonds arise from sharing electron pairs between atoms of similar electronegativity.'],
    ['Bond Types', 'Covalent Bond', 'Polarity', 'Medium', 'Application Based', 'A bond between atoms of different electronegativity in which electrons are shared unequally is called:', ['Polar covalent', 'Non-polar covalent', 'Ionic', 'Metallic'], 0, 'Unequal sharing produces a polar covalent bond with partial charges.'],
    ['Bond Types', 'Coordinate Bond', 'Dative bond', 'Medium', 'Direct MCQ', 'A coordinate (dative) bond is one in which:', ['Both electrons come from one atom', 'Electrons are shared equally', 'Electrons are completely transferred', 'No electrons are involved'], 0, 'In a dative bond, the shared pair is contributed entirely by one atom, e.g., NH4⁺.'],
    ['Bond Types', 'Coordinate Bond', 'NH4 example', 'Medium', 'Application Based', 'In NH4⁺, the fourth N–H bond is:', ['Coordinate', 'Pure ionic', 'Metallic', 'A hydrogen bond'], 0, 'The N–H bond formed by donation of the lone pair on NH3 to H⁺ is a coordinate bond.'],
    ['VSEPR Theory', 'Molecular Shape', 'Electron pairs', 'Easy', 'Direct MCQ', 'According to VSEPR theory, electron pairs around the central atom:', ['Arrange to minimise repulsion', 'Stack randomly', 'Always form a cube', 'Merge into one pair'], 0, 'Electron pairs (bonding and lone) arrange to minimise repulsion, determining shape.'],
    ['VSEPR Theory', 'Molecular Shape', 'Tetrahedral', 'Easy', 'Direct MCQ', 'The shape of CH4 is:', ['Tetrahedral', 'Square planar', 'Linear', 'Trigonal bipyramidal'], 0, 'Four bond pairs around carbon give a tetrahedral shape (109.5°).'],
    ['VSEPR Theory', 'Lone Pairs', 'Bond angle compression', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'The bond angle in water is less than 109.5°.', reason: 'Lone pairs repel more strongly than bond pairs and compress the H–O–H angle.' }],
    ['VSEPR Theory', 'Lone Pairs', 'NH3 shape', 'Medium', 'Direct MCQ', 'The shape of NH3 is:', ['Trigonal pyramidal', 'Tetrahedral', 'Trigonal planar', 'Bent'], 0, 'One lone pair on nitrogen distorts the tetrahedral arrangement into a trigonal pyramid.'],
    ['VSEPR Theory', 'Molecular Shape', 'Linear molecules', 'Medium', 'Multiple Statement', 'Which of the following are linear?\nI. CO2\nII. BeCl2\nIII. SO2', ['I and II', 'II and III', 'I and III', 'I, II and III'], 0, 'CO2 and BeCl2 are linear (sp); SO2 is bent due to a lone pair.'],
    ['VSEPR Theory', 'Lone Pairs', 'XeF4 shape', 'Hard', 'Direct MCQ', 'The shape of XeF4 is:', ['Square planar', 'Tetrahedral', 'Octahedral', 'See-saw'], 0, 'XeF4 has 6 electron pairs: 4 bonding + 2 lone pairs opposite each other → square planar.'],
    ['Hybridisation', 'sp3', 'Methane', 'Easy', 'Direct MCQ', 'The hybridisation of carbon in CH4 is:', ['sp3', 'sp2', 'sp', 'sp3d'], 0, 'Four σ-bonds around carbon require sp3 hybridisation.'],
    ['Hybridisation', 'sp2', 'Ethene', 'Medium', 'Direct MCQ', 'In C2H4, each carbon is:', ['sp2 hybridised with one π-bond', 'sp3 hybridised', 'sp hybridised', 'unhybridised'], 0, 'Each carbon in ethene is sp2 with a p orbital forming the π-bond between the carbons.'],
    ['Hybridisation', 'sp', 'Acetylene', 'Medium', 'Direct MCQ', 'The hybridisation of each carbon in acetylene (C2H2) is:', ['sp', 'sp2', 'sp3', 'sp3d'], 0, 'Each carbon in C2H2 is sp hybridised with two π-bonds.'],
    ['Hybridisation', 'sp3', 'Ammonia angle', 'Medium', 'Statement Based', 'Statement: In NH3 the bond angle is about 107° because of lone-pair repulsion. This statement is:', ['True', 'False — it is 109.5°', 'True — only in the gas phase', 'False — it is 120°'], 0, 'The lone pair compresses the tetrahedral angle from 109.5° to about 107°.'],
    ['Hybridisation', 'sp2', 'Bonding in benzene', 'Hard', 'Application Based', 'In benzene, each carbon is sp2 hybridised, and the delocalised electrons form:', ['A π-cloud above and below the ring', 'Localised single bonds only', 'Ionic bonds', 'Hydrogen bonds'], 0, 'Benzene’s six π-electrons delocalise into a ring-shaped π-cloud.'],
    ['Bond Parameters', 'Bond Length', 'Bond order', 'Medium', 'Numerical', 'The bond order of N2 is:', ['3', '2', '1', '2.5'], 0, 'N2 has a triple bond: bond order 3, the highest among the common diatomics.'],
    ['Bond Parameters', 'Bond Length', 'Trend', 'Medium', 'Statement Based', 'Statement: Bond length decreases as bond order increases. This statement is:', ['True', 'False — it increases', 'True — only for hydrogen', 'False — bond length is constant'], 0, 'Higher bond order means stronger, shorter bonds (e.g., C≡C < C=C < C–C).'],
    ['Bond Parameters', 'Dipole Moment', 'Symmetry', 'Medium', 'Application Based', 'CO2 has zero dipole moment because:', ['It is linear and symmetric', 'It is polar', 'It has lone pairs', 'It is an ion'], 0, 'Equal and opposite bond dipoles cancel in linear CO2.'],
    ['Bond Parameters', 'Dipole Moment', 'H2O polarity', 'Medium', 'Direct MCQ', 'Water has a net dipole moment because:', ['It is bent, so bond dipoles do not cancel', 'It is linear', 'O has no lone pairs', 'It is non-polar'], 0, 'The bent shape of water leaves a net dipole moment.'],
    ['Bond Parameters', 'Bond Energy', 'Definition', 'Easy', 'Direct MCQ', 'Bond dissociation energy is the energy required to:', ['Break one mole of bonds of a given type', 'Form one bond', 'Melt the substance', 'Ionise the atom'], 0, 'Bond dissociation energy = energy to break one mole of bonds in the gaseous state.'],
    ['Bond Parameters', 'Bond Energy', 'Trend', 'Medium', 'Numerical', 'The bond energy order for carbon–carbon bonds is:', ['C≡C > C=C > C–C', 'C–C > C=C > C≡C', 'C=C > C≡C > C–C', 'All equal'], 0, 'Triple bonds are strongest: C≡C (≈ 839) > C=C (≈ 614) > C–C (≈ 348 kJ/mol).'],
    ['Bond Types', 'Covalent Bond', 'Fajan rules', 'Hard', 'Statement Based', 'Statement: Small, highly charged cations favour covalent character in ionic compounds. This statement is:', ['True — per Fajans’ rules', 'False — they favour ionic character', 'True — only for anions', 'False — charge has no effect'], 0, 'Fajans’ rules: small highly charged cations (and large anions) polarise the electron cloud, increasing covalent character.'],
    ['Bond Types', 'Ionic Bond', 'NaCl property', 'Medium', 'Application Based', 'NaCl is a high-melting solid because:', ['Of strong electrostatic forces in the ionic lattice', 'It has covalent bonds', 'It is a metal', 'It has hydrogen bonds'], 0, 'The strong ionic lattice requires high energy to break, giving a high melting point.'],
    ['VSEPR Theory', 'Molecular Shape', 'Trigonal planar', 'Easy', 'Direct MCQ', 'The shape of BF3 is:', ['Trigonal planar', 'Tetrahedral', 'Linear', 'Bent'], 0, 'Three bond pairs around boron give a trigonal planar shape (120°).'],
    ['Hybridisation', 'sp', 'BeCl2', 'Medium', 'Direct MCQ', 'BeCl2 is linear with each Be–Cl bond:', ['sp hybridised on Be', 'sp2 hybridised', 'sp3 hybridised', 'purely ionic'], 0, 'Beryllium uses sp hybridisation for two linear bonds.'],
    ['Bond Parameters', 'Dipole Moment', 'NH3 vs NF3', 'Hard', 'Assertion & Reason', '', AR_OPTIONS, 1, '', 1, 0, { assertion: 'NH3 has a higher dipole moment than NF3.', reason: 'In NF3 the N–F bond dipoles largely cancel the lone-pair dipole, while in NH3 they reinforce it.' }],
    ['Bond Types', 'Covalent Bond', 'Sigma and pi', 'Medium', 'Direct MCQ', 'A double bond consists of:', ['One σ-bond and one π-bond', 'Two σ-bonds', 'Two π-bonds', 'One ionic bond'], 0, 'A double bond = 1 σ + 1 π; a triple bond = 1 σ + 2 π.'],
    ['Bond Parameters', 'Bond Length', 'Atomic size', 'Medium', 'Statement Based', 'Statement: Bond length increases down a group. This statement is:', ['True — larger atoms form longer bonds', 'False — bond length decreases', 'True — only in ionic compounds', 'False — size has no effect'], 0, 'Larger atomic radii produce longer bonds (e.g., HI > HBr > HCl).'],
  ],
})

/* ================================================================== */
/* 6 · JEE + NEET Chemistry — Organic Chemistry Basics (25)            */
/* ================================================================== */
export const organicBasicsPool = buildStudioPools({
  sourceId: 'SRC-CHE-ORGCHEM-006', domain: 'Competitive', exam: 'JEE Main + NEET UG', subject: 'Chemistry', chapter: 'Organic Chemistry — Some Basic Principles & Techniques',
  rows: [
    ['Nomenclature', 'IUPAC Rules', 'Longest chain', 'Easy', 'Direct MCQ', 'In IUPAC nomenclature, the parent chain is:', ['The longest continuous carbon chain', 'The most branched chain', 'Any chain with a double bond', 'The shortest chain'], 0, 'The longest continuous chain containing the principal functional group is the parent.'],
    ['Nomenclature', 'Functional Groups', 'Priority', 'Medium', 'Sequence / Arrangement', 'Arrange the following functional groups in decreasing IUPAC priority:\nI. Carboxylic acid\nII. Aldehyde\nIII. Alcohol\nIV. Ketone', ['I → II → IV → III', 'II → I → III → IV', 'I → III → II → IV', 'IV → III → II → I'], 0, 'Priority: carboxylic acid > aldehyde > ketone > alcohol.'],
    ['Nomenclature', 'IUPAC Rules', 'Prop-1-ene', 'Easy', 'Direct MCQ', 'The IUPAC name of CH3–CH=CH2 is:', ['Prop-1-ene', 'Propane', 'Prop-2-ene', 'Cyclopropene'], 0, 'The double bond is given the lowest locant: prop-1-ene.'],
    ['Nomenclature', 'IUPAC Rules', 'Locants', 'Medium', 'Statement Based', 'Statement: Substituents are named in alphabetical order in IUPAC names. This statement is:', ['True', 'False — by size', 'True — only for cyclic compounds', 'False — by electronegativity'], 0, 'Alphabetical order of substituent prefixes is an IUPAC rule.'],
    ['Electron Effects', 'Inductive Effect', 'Direction', 'Medium', 'Direct MCQ', 'The −I effect is shown by which group?', ['−NO2', '−CH3', '−C2H5', '−NH2'], 0, 'NO2 withdraws electrons (−I); alkyl groups release electrons (+I).'],
    ['Electron Effects', 'Inductive Effect', 'Acidity', 'Medium', 'Application Based', 'Chloroacetic acid is a stronger acid than acetic acid because:', ['Cl shows a −I effect stabilising the anion', 'Cl shows +I effect', 'Cl is larger', 'Cl forms hydrogen bonds'], 0, 'The electron-withdrawing −I effect of Cl stabilises the carboxylate anion, increasing acidity.'],
    ['Electron Effects', 'Inductive Effect', 'Range', 'Medium', 'Statement Based', 'Statement: The inductive effect is significant over long chains. This statement is:', ['False — it weakens rapidly with distance', 'True — it grows with distance', 'True — only in aromatic rings', 'False — it is always zero'], 0, 'The inductive effect falls off rapidly and is significant over about three bonds.'],
    ['Electron Effects', 'Resonance', 'Definition', 'Easy', 'Direct MCQ', 'Resonance is the:', ['Delocalisation of π-electrons in a conjugated system', 'Rotation about a double bond', 'Breaking of σ-bonds', 'Transfer of protons'], 0, 'Resonance delocalises π-electrons; the molecule is a hybrid of contributing structures.'],
    ['Electron Effects', 'Resonance', 'Stability', 'Medium', 'Application Based', 'The carboxylate ion is stabilised because:', ['Its negative charge is delocalised by resonance', 'It has no charge', 'It is an acid', 'It forms a ring'], 0, 'Resonance delocalises the negative charge over both oxygen atoms, stabilising the ion.'],
    ['Electron Effects', 'Resonance', 'Benzene bonds', 'Medium', 'Statement Based', 'Statement: All C–C bonds in benzene are of equal length. This statement is:', ['True — the π-electrons are delocalised', 'False — alternate bonds are different', 'True — only at high temperature', 'False — benzene has no π-system'], 0, 'Delocalisation makes all six C–C bonds equivalent (≈ 1.39 Å).'],
    ['Electron Effects', 'Resonance', 'Significant structure', 'Medium', 'Multiple Statement', 'Which factors make a resonance structure more significant?\nI. More covalent bonds\nII. Negative charge on a more electronegative atom\nIII. Complete octets', ['I, II and III', 'I and II only', 'II and III only', 'I only'], 0, 'More bonds, charge on electronegative atoms and complete octets increase significance.'],
    ['Electron Effects', 'Hyperconjugation', 'Definition', 'Hard', 'Direct MCQ', 'Hyperconjugation involves the delocalisation of:', ['σ(C–H) electrons into an adjacent empty p-orbital', 'π-electrons only', 'Lone pairs only', 'Core electrons'], 0, 'Hyperconjugation (no-bond resonance) delocalises σ(C–H) electrons into an adjacent empty p-orbital.'],
    ['Electron Effects', 'Hyperconjugation', 'Alkene stability', 'Medium', 'Application Based', 'The stability order of alkenes (more substituted > less) is explained by:', ['Hyperconjugation and the number of α-hydrogens', 'Inductive effect alone', 'Resonance only', 'Steric hindrance only'], 0, 'More α-hydrogens mean more hyperconjugative structures, stabilising the alkene.'],
    ['Reactive Intermediates', 'Carbocations', 'Stability order', 'Medium', 'Sequence / Arrangement', 'Arrange in decreasing carbocation stability:\nI. (CH3)3C⁺\nII. (CH3)2CH⁺\nIII. CH3CH2⁺\nIV. CH3⁺', ['I → II → III → IV', 'IV → III → II → I', 'I → III → II → IV', 'II → I → III → IV'], 0, 'Carbocation stability: 3° > 2° > 1° > methyl.'],
    ['Reactive Intermediates', 'Carbocations', 'Geometry', 'Medium', 'Statement Based', 'Statement: A carbocation is planar with sp2 hybridisation. This statement is:', ['True', 'False — it is sp3', 'True — only in benzene', 'False — it is tetrahedral'], 0, 'Carbocations are planar, sp2 hybridised, with an empty p-orbital.'],
    ['Reactive Intermediates', 'Carbanions', 'Stability', 'Medium', 'Direct MCQ', 'Carbanions are stabilised by:', ['Electron-withdrawing groups', 'Alkyl groups', 'Empty orbitals', 'Hyperconjugation only'], 0, 'Electron-withdrawing (−I/−R) groups delocalise the negative charge and stabilise carbanions.'],
    ['Reactive Intermediates', 'Free Radicals', 'Peroxide effect', 'Medium', 'Application Based', 'The peroxide (Kharasch) effect in HBr addition to propene proceeds through:', ['A free-radical intermediate', 'A carbocation', 'A carbanion', 'A carbene'], 0, 'Peroxides initiate a free-radical chain giving anti-Markovnikov addition of HBr.'],
    ['Reactive Intermediates', 'Carbocations', 'Markovnikov', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'HBr adds to propene to give 2-bromopropane as the major product.', reason: 'The addition proceeds through the more stable secondary carbocation.' }],
    ['Isomerism', 'Structural Isomerism', 'Types', 'Medium', 'Multiple Statement', 'Which of the following are structural isomers of C4H10O?\nI. Butan-1-ol\nII. Butan-2-ol\nIII. 2-Methylpropan-1-ol', ['I, II and III', 'I and II only', 'II and III only', 'I only'], 0, 'All three are constitutional isomers with the formula C4H10O.'],
    ['Isomerism', 'Stereoisomerism', 'Chirality', 'Hard', 'Direct MCQ', 'A carbon atom bonded to four different groups is called:', ['A chiral centre', 'A carbocation', 'An sp2 centre', 'A radical centre'], 0, 'Four different substituents make the carbon chiral; its mirror images are non-superimposable.'],
    ['Electron Effects', 'Inductive Effect', 'Effect on acidity of alcohols', 'Medium', 'Application Based', 'Among ethanol, 2-chloroethanol and 2,2,2-trifluoroethanol, the strongest acid is:', ['2,2,2-Trifluoroethanol', 'Ethanol', '2-Chloroethanol', 'All are equal'], 0, 'The strong −I effect of three fluorines stabilises the alkoxide ion best.'],
    ['Nomenclature', 'Functional Groups', 'Aldehyde suffix', 'Easy', 'Direct MCQ', 'The suffix used for aldehydes in IUPAC nomenclature is:', ['-al', '-one', '-ol', '-oic acid'], 0, 'Aldehydes use the suffix −al (e.g., ethanol for CH3CHO).'],
    ['Nomenclature', 'Functional Groups', 'Ketone suffix', 'Easy', 'Direct MCQ', 'The IUPAC suffix for a ketone is:', ['-one', '-al', '-ene', '-yne'], 0, 'Ketones end in −one, e.g., propan-2-one.'],
    ['Reactive Intermediates', 'Free Radicals', 'Stability', 'Medium', 'Direct MCQ', 'The stability order of free radicals is:', ['3° > 2° > 1° > methyl', 'Methyl > 1° > 2° > 3°', '2° > 3° > 1°', 'All are equal'], 0, 'Radical stability follows 3° > 2° > 1° > methyl.'],
    ['Electron Effects', 'Resonance', 'Allyl cation', 'Medium', 'Statement Based', 'Statement: The allyl cation is stabilised by resonance. This statement is:', ['True — the positive charge is delocalised', 'False — it has no π-system', 'True — only in water', 'False — it is a radical'], 0, 'The allyl cation (CH2=CH–CH2⁺) delocalises its positive charge over two carbons by resonance.'],
  ],
})


/* ================================================================== */
/* 7 · JEE Physics — Kinematics (25)                                   */
/* ================================================================== */
export const kinematicsPool = buildStudioPools({
  sourceId: 'SRC-JEE-PHY-KIN-007', domain: 'Competitive', exam: 'JEE Main', subject: 'Physics', chapter: 'Kinematics',
  rows: [
    ['Motion in 1D', 'Position & Displacement', 'Definition', 'Easy', 'Direct MCQ', 'Displacement is:', ['The change in position (vector)', 'The total path length', 'Always positive', 'Speed × time only'], 0, 'Displacement is the straight-line change in position; distance is the path length.'],
    ['Motion in 1D', 'Velocity', 'Average velocity', 'Easy', 'Direct MCQ', 'Average velocity is defined as:', ['Total displacement ÷ total time', 'Total distance ÷ total time', 'Acceleration × time', 'Speed ÷ 2'], 0, 'Average velocity = displacement/time; average speed = distance/time.'],
    ['Motion in 1D', 'Acceleration', 'Equations', 'Medium', 'Numerical', 'A body starts from rest and accelerates uniformly at 4 m/s². Its velocity after 5 s is:', ['20 m/s', '9 m/s', '4 m/s', '25 m/s'], 0, 'v = u + at = 0 + 4 × 5 = 20 m/s.'],
    ['Motion in 1D', 'Acceleration', 'Distance in nth second', 'Hard', 'Numerical', 'The distance travelled in the 4th second by a body starting from rest with acceleration 2 m/s² is:', ['7 m', '8 m', '4 m', '16 m'], 0, 's_n = u + a(n − ½) = 0 + 2 × 3.5 = 7 m.'],
    ['Motion in 1D', 'Velocity', 'Free fall', 'Easy', 'Numerical', 'A ball dropped from rest (g = 10) reaches the ground in 2 s. The height of the drop is:', ['20 m', '10 m', '40 m', '5 m'], 0, 'h = ½gt² = ½ × 10 × 4 = 20 m.'],
    ['Motion in 1D', 'Acceleration', 'Uniform motion', 'Medium', 'Statement Based', 'Statement: A body moving with constant speed in a straight line has zero acceleration. This statement is:', ['True', 'False — speed always implies acceleration', 'True — only in free fall', 'False — constant speed never occurs'], 0, 'Constant speed along a straight line means zero acceleration.'],
    ['Graphs', 'v–t Graphs', 'Slope meaning', 'Medium', 'Direct MCQ', 'The slope of a velocity–time graph gives:', ['Acceleration', 'Displacement', 'Speed', 'Force'], 0, 'The v–t slope is acceleration; its area gives displacement.'],
    ['Graphs', 'v–t Graphs', 'Area meaning', 'Medium', 'Direct MCQ', 'The area under a velocity–time graph between two instants gives:', ['Displacement', 'Acceleration', 'Velocity', 'Jerk'], 0, '∫v dt = displacement over the interval.'],
    ['Graphs', 'x–t Graphs', 'Slope meaning', 'Easy', 'Direct MCQ', 'The slope of a position–time graph gives:', ['Velocity', 'Acceleration', 'Force', 'Momentum'], 0, 'The x–t slope is the instantaneous velocity.'],
    ['Graphs', 'v–t Graphs', 'Constant velocity', 'Medium', 'Application Based', 'A v–t graph that is a horizontal line above the axis represents:', ['Constant positive velocity', 'Uniform acceleration', 'Rest', 'Returning to start'], 0, 'A flat v–t line means constant velocity with zero acceleration.'],
    ['Graphs', 'x–t Graphs', 'Curved graph', 'Medium', 'Statement Based', 'Statement: A curved position–time graph indicates changing velocity. This statement is:', ['True', 'False — it means constant velocity', 'True — only if concave down', 'False — curves show no motion'], 0, 'A curved x–t graph has a changing slope, hence changing velocity.'],
    ['Projectile Motion', 'Time of Flight', 'Formula', 'Medium', 'Numerical', 'A projectile launched at 20 m/s at 30° (g = 10) has a time of flight of:', ['2 s', '1 s', '4 s', '3 s'], 0, 'T = 2u sin θ/g = 2 × 20 × 0.5/10 = 2 s.'],
    ['Projectile Motion', 'Maximum Height', 'Formula', 'Medium', 'Numerical', 'The maximum height reached by a projectile with u = 20 m/s at 30° (g = 10) is:', ['5 m', '10 m', '20 m', '15 m'], 0, 'H = u² sin²θ/(2g) = 400 × 0.25/20 = 5 m.'],
    ['Projectile Motion', 'Range', 'Maximum range', 'Medium', 'Direct MCQ', 'The range of a projectile is maximum when the launch angle is:', ['45°', '30°', '60°', '90°'], 0, 'R = u² sin 2θ/g is maximum at 45°.'],
    ['Projectile Motion', 'Range', 'Complementary angles', 'Medium', 'Statement Based', 'Statement: Two complementary launch angles give the same range. This statement is:', ['True — sin 2θ is the same for θ and 90° − θ', 'False — ranges always differ', 'True — only in vacuum', 'False — only for 45°'], 0, 'sin(2(90°−θ)) = sin(180°−2θ) = sin 2θ, so ranges are equal.'],
    ['Projectile Motion', 'Time of Flight', 'Highest point velocity', 'Medium', 'Application Based', 'At the highest point of a projectile, the velocity is:', ['Horizontal (u cos θ)', 'Vertical (u sin θ)', 'Zero', 'u'], 0, 'The vertical component is zero at the top; horizontal velocity u cos θ remains.'],
    ['Projectile Motion', 'Range', 'Horizontal range formula', 'Easy', 'Direct MCQ', 'The horizontal range of a projectile is:', ['u² sin 2θ / g', 'u² sin θ / g', 'u sin θ / g', '2u²/g'], 0, 'R = u² sin 2θ/g.'],
    ['Relative Motion', 'Relative Velocity', 'Same direction', 'Easy', 'Numerical', 'Two cars move at 60 km/h and 40 km/h in the same direction. The relative velocity of the faster with respect to the slower is:', ['20 km/h', '100 km/h', '60 km/h', '40 km/h'], 0, 'v_rel = 60 − 40 = 20 km/h.'],
    ['Relative Motion', 'Relative Velocity', 'Opposite directions', 'Easy', 'Numerical', 'Two trains move toward each other at 30 m/s each. The relative speed is:', ['60 m/s', '30 m/s', '0', '15 m/s'], 0, 'Opposite directions: relative speed = 30 + 30 = 60 m/s.'],
    ['Relative Motion', 'River Problems', 'Minimum time crossing', 'Medium', 'Application Based', 'To cross a river in minimum time, a swimmer should:', ['Swim perpendicular to the bank', 'Swim upstream at an angle', 'Swim downstream at an angle', 'Stay still'], 0, 'Swimming perpendicular minimises crossing time; the current only carries the swimmer downstream.'],
    ['Relative Motion', 'River Problems', 'Minimum distance', 'Medium', 'Application Based', 'To cross a river with minimum drift, the swimmer must:', ['Aim upstream at an angle such that the resultant velocity is perpendicular', 'Swim straight across', 'Swim downstream', 'Increase speed arbitrarily'], 0, 'Aiming upstream cancels the current, making the resultant velocity perpendicular to the bank.'],
    ['Relative Motion', 'Rain Problems', 'Apparent rain', 'Medium', 'Application Based', 'A man walks east at 3 m/s while rain falls vertically at 4 m/s. The apparent rain velocity relative to him has magnitude:', ['5 m/s', '3 m/s', '4 m/s', '7 m/s'], 0, 'v_rain,man = v_rain − v_man → √(4² + 3²) = 5 m/s.'],
    ['Graphs', 'a–t Graphs', 'Area meaning', 'Medium', 'Direct MCQ', 'The area under an acceleration–time graph gives:', ['Change in velocity', 'Displacement', 'Speed', 'Force'], 0, '∫a dt = Δv.'],
    ['Motion in 1D', 'Velocity', 'v from v(t)', 'Medium', 'Numerical', 'A particle moves with v(t) = 6t − 2 m/s. Its displacement in the first 2 seconds is:', ['8 m', '4 m', '10 m', '12 m'], 0, 's = ∫₀² (6t − 2) dt = [3t² − 2t]₀² = 12 − 4 = 8 m.'],
    ['Motion in 1D', 'Acceleration', 'Non-uniform', 'Medium', 'Statement Based', 'Statement: When acceleration is not constant, the kinematic equations v = u + at are not directly valid. This statement is:', ['True — they require constant acceleration', 'False — they are always valid', 'True — only in 2-D', 'False — only for projectiles'], 0, 'The standard kinematic equations assume uniform acceleration.'],
  ],
})

/* ================================================================== */
/* 8 · JEE Mathematics — Limits & Continuity (25)                      */
/* ================================================================== */
export const limitsPool = buildStudioPools({
  sourceId: 'SRC-JEE-MAT-LIM-008', domain: 'Competitive', exam: 'JEE Main', subject: 'Mathematics', chapter: 'Limits & Continuity',
  rows: [
    ['Standard Limits', 'sin x / x', 'Basic limit', 'Easy', 'Direct MCQ', 'lim(x→0) sin x / x equals:', ['1', '0', '∞', '−1'], 0, 'The standard limit is 1.'],
    ['Standard Limits', 'sin x / x', 'Scaled argument', 'Medium', 'Numerical', 'lim(x→0) sin 3x / x equals:', ['3', '1', '1/3', '9'], 0, 'lim sin 3x/x = 3 · lim sin 3x/(3x) = 3.'],
    ['Standard Limits', '(1+x)^(1/x)', 'e definition', 'Medium', 'Numerical', 'lim(x→0) (1 + x)^(1/x) equals:', ['e', '1', '0', 'e²'], 0, 'By definition this limit is e.'],
    ['Standard Limits', 'Exponential & Logarithmic', 'e^x limit', 'Medium', 'Numerical', 'lim(x→0) (e^x − 1)/x equals:', ['1', '0', 'e', '∞'], 0, 'The standard exponential limit is 1.'],
    ['Standard Limits', 'Exponential & Logarithmic', 'ln limit', 'Medium', 'Numerical', 'lim(x→0) ln(1 + x)/x equals:', ['1', '0', 'e', '−1'], 0, 'lim ln(1+x)/x = 1.'],
    ['Standard Limits', 'sin x / x', '1 − cos x', 'Medium', 'Numerical', 'lim(x→0) (1 − cos x)/x² equals:', ['1/2', '0', '1', '2'], 0, 'Using 1 − cos x ≈ x²/2, the limit is 1/2.'],
    ['Techniques', 'Factorisation', 'Cancellation', 'Easy', 'Numerical', 'lim(x→2) (x² − 4)/(x − 2) equals:', ['4', '0', '2', '∞'], 0, 'Factorise: (x−2)(x+2)/(x−2) → 4.'],
    ['Techniques', 'Rationalisation', 'Radical limit', 'Medium', 'Numerical', 'lim(x→0) (√(1+x) − 1)/x equals:', ['1/2', '1', '0', '∞'], 0, 'Rationalise: 1/(√(1+x)+1) → 1/2.'],
    ['Techniques', 'L’Hôpital’s Rule', 'Condition', 'Medium', 'Statement Based', 'Statement: L’Hôpital’s rule applies only to indeterminate forms such as 0/0 or ∞/∞. This statement is:', ['True', 'False — it applies to any form', 'True — only for polynomials', 'False — only for 1/0'], 0, 'The rule requires an indeterminate form; applying it otherwise gives wrong answers.'],
    ['Techniques', 'L’Hôpital’s Rule', 'Application', 'Medium', 'Numerical', 'lim(x→0) (e^x − 1 − x)/x² equals:', ['1/2', '0', '1', '∞'], 0, 'Two applications of L’Hôpital (or expansion) give 1/2.'],
    ['Techniques', 'Factorisation', 'x→∞ rational', 'Medium', 'Numerical', 'lim(x→∞) (3x² + 2x)/(x² − 1) equals:', ['3', '2', '1', '∞'], 0, 'Divide by x²: numerator → 3, denominator → 1.'],
    ['Expansions', 'Taylor/Maclaurin Series', 'sin expansion', 'Medium', 'Application Based', 'Using the series for sin x, lim(x→0) (x − sin x)/x³ equals:', ['1/6', '1/2', '1', '0'], 0, 'sin x ≈ x − x³/6 → (x³/6)/x³ = 1/6.'],
    ['Expansions', 'Taylor/Maclaurin Series', 'cos expansion', 'Medium', 'Numerical', 'lim(x→0) (1 − cos x)/x² using expansion equals:', ['1/2', '1/6', '1', '0'], 0, 'cos x ≈ 1 − x²/2 → limit 1/2.'],
    ['Expansions', 'Taylor/Maclaurin Series', 'ln expansion', 'Hard', 'Numerical', 'lim(x→0) (ln(1+x) − x)/x² equals:', ['−1/2', '1/2', '1', '0'], 0, 'ln(1+x) ≈ x − x²/2 → (−x²/2)/x² = −1/2.'],
    ['Continuity', 'Definition', 'Continuity at a point', 'Medium', 'Direct MCQ', 'A function f is continuous at x = a if:', ['lim(x→a) f(x) = f(a)', 'f(a) is defined', 'lim exists', 'f is differentiable'], 0, 'Continuity requires the limit to equal the value: lim f(x) = f(a).'],
    ['Continuity', 'Types of Discontinuity', 'Removable', 'Medium', 'Application Based', 'f(x) = (x² − 1)/(x − 1) has what kind of discontinuity at x = 1?', ['Removable', 'Jump', 'Infinite', 'None'], 0, 'The limit exists (2) but the function is undefined — a removable discontinuity.'],
    ['Continuity', 'Types of Discontinuity', 'Jump', 'Medium', 'Direct MCQ', 'A function with different left and right limits at a point has a:', ['Jump discontinuity', 'Removable discontinuity', 'Point of continuity', 'Vertical asymptote'], 0, 'Unequal one-sided limits produce a jump discontinuity.'],
    ['Continuity', 'Continuity on an Interval', 'Polynomials', 'Easy', 'Statement Based', 'Statement: Polynomial functions are continuous everywhere. This statement is:', ['True', 'False — they have jumps', 'True — only on [0,1]', 'False — they diverge'], 0, 'Polynomials are continuous on the whole real line.'],
    ['Continuity', 'Continuity on an Interval', 'Extreme value theorem', 'Medium', 'Direct MCQ', 'A continuous function on a closed interval [a, b]:', ['Attains its maximum and minimum', 'Is always increasing', 'Must be differentiable', 'Has no roots'], 0, 'The extreme value theorem guarantees a maximum and a minimum on closed intervals.'],
    ['Continuity', 'Definition', '|x| at 0', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 1, '', 1, 0, { assertion: 'f(x) = |x| is continuous at x = 0.', reason: 'f(x) = |x| is differentiable at x = 0.' }],
    ['Standard Limits', '(1+x)^(1/x)', '1^∞ form', 'Hard', 'Application Based', 'lim(x→0) (1 + 2x)^(1/x) equals:', ['e²', 'e', '2', '1'], 0, '(1 + 2x)^(1/x) = [(1+2x)^(1/(2x))]² → e².'],
    ['Techniques', 'L’Hôpital’s Rule', 'Repeated use', 'Medium', 'Numerical', 'lim(x→0) (1 − cos 2x)/x² equals:', ['2', '1', '1/2', '4'], 0, '1 − cos 2x ≈ (2x)²/2 = 2x² → limit 2.'],
    ['Continuity', 'Types of Discontinuity', 'Infinite', 'Medium', 'Direct MCQ', 'lim(x→0+) 1/x is:', ['+∞ (infinite behaviour)', '0', '1', '−∞'], 0, '1/x → +∞ as x → 0⁺; the function has an infinite discontinuity at 0.'],
    ['Expansions', 'Taylor/Maclaurin Series', 'e^x expansion', 'Medium', 'Numerical', 'lim(x→0) (e^x − 1 − x − x²/2)/x³ equals:', ['1/6', '0', '1', '1/2'], 0, 'e^x ≈ 1 + x + x²/2 + x³/6 → the limit is 1/6.'],
    ['Continuity', 'Continuity on an Interval', 'Rationals', 'Easy', 'Statement Based', 'Statement: A rational function is continuous wherever its denominator is non-zero. This statement is:', ['True', 'False — always discontinuous', 'True — only for quadratic denominators', 'False — never continuous'], 0, 'Rational functions are continuous on their domain (denominator ≠ 0).'],
  ],
})

/* ================================================================== */
/* 9 · NEET Biology — Human Physiology (25)                            */
/* ================================================================== */
export const humanPhysiologyPool = buildStudioPools({
  sourceId: 'SRC-NEET-BIO-PHYS-009', domain: 'Competitive', exam: 'NEET UG', subject: 'Biology', chapter: 'Human Physiology',
  rows: [
    ['Circulation', 'Heart Structure', 'Chambers', 'Easy', 'Direct MCQ', 'The human heart has:', ['4 chambers', '2 chambers', '3 chambers', '5 chambers'], 0, 'Two atria and two ventricles form the four-chambered human heart.'],
    ['Circulation', 'Heart Structure', 'Pacemaker', 'Easy', 'Direct MCQ', 'The pacemaker of the heart is the:', ['SA node', 'AV node', 'Purkinje fibres', 'Bundle of His'], 0, 'The sinoatrial (SA) node initiates each heartbeat.'],
    ['Circulation', 'Cardiac Cycle', 'Systole', 'Medium', 'Direct MCQ', 'The cardiac cycle consists of:', ['Systole and diastole', 'Only systole', 'Only diastole', 'Respiration phases'], 0, 'Alternating contraction (systole) and relaxation (diastole) form the cycle.'],
    ['Circulation', 'Cardiac Cycle', 'Heart sounds', 'Medium', 'Match the Following', 'Match the heart sound with its cause:\nList-I: (1) Lub (2) Dub\nList-II: (A) Closure of AV valves (B) Closure of semilunar valves', ['1-A, 2-B', '1-B, 2-A', '1-A, 2-A', '1-B, 2-B'], 0, 'Lub is the AV-valve closure; dub is the semilunar-valve closure.'],
    ['Circulation', 'Cardiac Cycle', 'Cardiac output', 'Medium', 'Numerical', 'If stroke volume is 70 mL and the heart rate is 72/min, the cardiac output is about:', ['5.0 L/min', '1.4 L/min', '7.2 L/min', '0.7 L/min'], 0, 'CO = 70 × 72 = 5040 mL ≈ 5.0 L/min.'],
    ['Circulation', 'Blood Vessels', 'Oxygenated blood', 'Medium', 'Application Based', 'Which vessel carries oxygenated blood to the body?', ['Aorta', 'Pulmonary artery', 'Vena cava', 'Pulmonary vein'], 0, 'The aorta distributes oxygenated blood to the systemic circulation.'],
    ['Circulation', 'Blood Vessels', 'Pulmonary circuit', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'The pulmonary artery carries deoxygenated blood.', reason: 'It carries blood from the right ventricle to the lungs for oxygenation.' }],
    ['Respiration', 'Lung Volumes', 'Tidal volume', 'Easy', 'Numerical', 'The volume of air inspired or expired in a normal breath is about:', ['500 mL', '1200 mL', '250 mL', '4500 mL'], 0, 'Tidal volume is about 500 mL; residual volume is about 1200 mL.'],
    ['Respiration', 'Lung Volumes', 'Vital capacity', 'Medium', 'Direct MCQ', 'Vital capacity equals:', ['TV + IRV + ERV', 'TV + IRV', 'ERV + RV', 'TV only'], 0, 'VC = tidal volume + inspiratory reserve volume + expiratory reserve volume.'],
    ['Respiration', 'Gas Exchange', 'Site', 'Easy', 'Direct MCQ', 'Gas exchange occurs in the:', ['Alveoli', 'Trachea', 'Bronchi', 'Pleura'], 0, 'Alveoli are the thin-walled sites of O2/CO2 exchange by diffusion.'],
    ['Respiration', 'Transport of Gases', 'Oxygen transport', 'Medium', 'Direct MCQ', 'Most oxygen is transported in blood:', ['Bound to haemoglobin', 'Dissolved in plasma', 'As bicarbonate', 'As carbonic acid'], 0, 'About 97% of transported O2 is bound to haemoglobin.'],
    ['Respiration', 'Transport of Gases', 'CO2 transport', 'Medium', 'Direct MCQ', 'Most CO2 is carried in blood as:', ['Bicarbonate ions', 'Dissolved gas', 'Carbaminohaemoglobin', 'Oxyhaemoglobin'], 0, 'About 70% of CO2 is transported as bicarbonate (HCO3⁻).'],
    ['Respiration', 'Lung Volumes', 'Residual volume', 'Medium', 'Statement Based', 'Statement: Residual volume remains in the lungs after maximal expiration. This statement is:', ['True', 'False — the lungs empty fully', 'True — only in athletes', 'False — it is tidal volume'], 0, 'Residual volume (~1200 mL) prevents lung collapse and cannot be expired.'],
    ['Excretion', 'Nephron', 'Functional unit', 'Easy', 'Direct MCQ', 'The functional unit of the kidney is the:', ['Nephron', 'Neuron', 'Alveolus', 'Glomerulus only'], 0, 'The nephron (glomerulus + tubules) is the kidney’s functional unit.'],
    ['Excretion', 'Urine Formation', 'Filtration', 'Medium', 'Direct MCQ', 'Glomerular filtrate is formed by:', ['Filtration of blood under pressure', 'Active secretion', 'Diffusion of proteins', 'Reabsorption'], 0, 'High glomerular pressure forces a protein-free filtrate through the capillary wall.'],
    ['Excretion', 'Urine Formation', 'ADH', 'Medium', 'Application Based', 'ADH increases water reabsorption mainly in the:', ['Collecting duct', 'Proximal tubule', 'Glomerulus', 'Bowman’s capsule'], 0, 'ADH makes the collecting duct more permeable to water.'],
    ['Excretion', 'Urine Formation', 'Aldosterone', 'Medium', 'Direct MCQ', 'Aldosterone promotes the reabsorption of:', ['Na⁺', 'K⁺ only', 'Urea', 'Glucose'], 0, 'Aldosterone enhances Na⁺ reabsorption (and K⁺ secretion) in the distal tubule.'],
    ['Excretion', 'Urine Formation', 'Normal urine', 'Medium', 'Statement Based', 'Statement: Normal urine does not contain glucose. This statement is:', ['True — glucose is fully reabsorbed', 'False — urine always contains glucose', 'True — only in fasting', 'False — glucose is secreted'], 0, 'Glucose is completely reabsorbed in the proximal tubule; its presence indicates glycosuria.'],
    ['Excretion', 'Hormonal Control', 'ANF', 'Hard', 'Direct MCQ', 'Atrial natriuretic factor (ANF):', ['Opposes ADH and aldosterone, increasing urine output', 'Increases ADH secretion', 'Stimulates aldosterone', 'Has no effect on the kidney'], 0, 'ANF reduces Na⁺ reabsorption and opposes ADH/aldosterone, increasing urine output.'],
    ['Neural Control', 'Neuron', 'Resting potential', 'Medium', 'Direct MCQ', 'The resting membrane potential of a neuron is about:', ['−70 mV', '+70 mV', '0 mV', '−10 mV'], 0, 'The resting potential is about −70 mV, inside negative.'],
    ['Neural Control', 'Synapse', 'Transmission', 'Medium', 'Direct MCQ', 'Signals cross a chemical synapse via:', ['Neurotransmitters', 'Direct electrical contact only', 'Ions alone', 'Hormones in blood'], 0, 'Neurotransmitters diffuse across the synaptic cleft to the postsynaptic membrane.'],
    ['Neural Control', 'Reflex Arc', 'Pathway', 'Medium', 'Sequence / Arrangement', 'Arrange the reflex arc in order:\nI. Motor neuron\nII. Sensory neuron\nIII. Receptor\nIV. Effector', ['III → II → I → IV', 'II → III → I → IV', 'III → I → II → IV', 'I → II → III → IV'], 0, 'Receptor → sensory neuron → (spinal cord) → motor neuron → effector.'],
    ['Neural Control', 'Neuron', 'Myelin', 'Medium', 'Statement Based', 'Statement: Myelin speeds up nerve impulse conduction. This statement is:', ['True — via saltatory conduction', 'False — it slows conduction', 'True — only in the brain', 'False — myelin has no function'], 0, 'Myelinated fibres conduct impulses faster by saltatory (jumping) conduction.'],
    ['Circulation', 'Blood Vessels', 'Blood pressure', 'Medium', 'Numerical', 'A reading of 120/80 mmHg means the systolic pressure is:', ['120 mmHg', '80 mmHg', '100 mmHg', '40 mmHg'], 0, 'Systolic/diastolic = 120/80 mmHg; the first number is systolic.'],
    ['Respiration', 'Gas Exchange', 'Diffusion gradient', 'Medium', 'Application Based', 'Oxygen moves from alveoli to blood because:', ['The partial pressure of O2 is higher in alveoli', 'The blood pushes it out', 'CO2 carries it', 'The lungs contract'], 0, 'O2 diffuses down its partial-pressure gradient from alveoli (≈104 mmHg) to blood (≈40 mmHg).'],
  ],
})


/* ================================================================== */
/* 10 · University — Data Structures: Trees & Graphs (25)              */
/* ================================================================== */
export const treesGraphsPool = buildStudioPools({
  sourceId: 'SRC-UNI-CS501-TREES-010', domain: 'University', exam: null, subject: 'Data Structures & Algorithms', chapter: 'Trees & Graphs',
  rows: [
    ['Binary Trees', 'Tree Terminology', 'Edges', 'Easy', 'Direct MCQ', 'A tree with n nodes has exactly:', ['n − 1 edges', 'n edges', 'n + 1 edges', '2n edges'], 0, 'A tree is acyclic and connected, so it has exactly n − 1 edges.'],
    ['Binary Trees', 'Tree Terminology', 'Height', 'Easy', 'Direct MCQ', 'The height of a balanced binary tree with n nodes is:', ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], 0, 'A balanced binary tree keeps height O(log n).'],
    ['Binary Trees', 'Tree Terminology', 'Leaf count', 'Medium', 'Numerical', 'In a full binary tree with n internal nodes, the number of leaves is:', ['n + 1', 'n', 'n − 1', '2n'], 0, 'Every internal node has 2 children, so leaves = internal nodes + 1.'],
    ['Binary Trees', 'Tree Traversals', 'In-order', 'Easy', 'Direct MCQ', 'In-order traversal visits nodes in the order:', ['Left → root → right', 'Root → left → right', 'Left → right → root', 'Level by level'], 0, 'In-order is left, root, right — sorted order for a BST.'],
    ['Binary Trees', 'Tree Traversals', 'Pre-order', 'Easy', 'Direct MCQ', 'Pre-order traversal is:', ['Root → left → right', 'Left → root → right', 'Left → right → root', 'Queue based'], 0, 'Pre-order visits the root first, then left and right subtrees.'],
    ['Binary Trees', 'Tree Traversals', 'Postfix from post-order', 'Medium', 'Application Based', 'The post-order traversal of an expression tree gives:', ['Postfix notation', 'Infix notation', 'Prefix notation', 'Sorted order'], 0, 'Post-order of an expression tree yields postfix (RPN).'],
    ['Binary Trees', 'Tree Traversals', 'Level-order data structure', 'Medium', 'Direct MCQ', 'Level-order traversal typically uses a:', ['Queue', 'Stack', 'Priority queue', 'Hash table'], 0, 'A queue processes nodes level by level in FIFO order.'],
    ['Binary Trees', 'Tree Traversals', 'Reconstruction', 'Hard', 'Statement Based', 'Statement: A binary tree can be uniquely reconstructed from its pre-order and in-order traversals. This statement is:', ['True', 'False — no pair suffices', 'True — only for full trees', 'False — only in-order is needed'], 0, 'Pre-order gives the root and in-order partitions left/right, enabling unique reconstruction.'],
    ['Binary Trees', 'Expression Trees', 'Postfix evaluation', 'Medium', 'Application Based', 'Given the postfix expression "3 4 + 2 *", the value is:', ['14', '10', '12', '20'], 0, '3 + 4 = 7; 7 × 2 = 14.'],
    ['BST & Heaps', 'BST Operations', 'Search cost', 'Medium', 'Direct MCQ', 'Search in a BST costs:', ['O(height)', 'O(n) always', 'O(1)', 'O(log n) always'], 0, 'BST search costs O(height), which is O(log n) when balanced but O(n) when skewed.'],
    ['BST & Heaps', 'BST Operations', 'In-order property', 'Easy', 'Direct MCQ', 'An in-order traversal of a BST produces:', ['Sorted keys', 'Random order', 'Reverse order', 'Level order'], 0, 'In-order visits keys in ascending order.'],
    ['BST & Heaps', 'AVL Trees', 'Balance factor', 'Medium', 'Direct MCQ', 'In an AVL tree, the balance factor of any node is:', ['−1, 0 or +1', 'Any integer', 'Always 0', '1 or 2'], 0, 'AVL trees allow balance factors of −1, 0 and +1 only.'],
    ['BST & Heaps', 'AVL Trees', 'Rotations', 'Medium', 'Application Based', 'Inserting into an AVL tree that becomes "left-left heavy" is fixed by:', ['A single right rotation', 'A single left rotation', 'A double rotation', 'Rebalancing the heap'], 0, 'An LL imbalance is corrected by one right rotation.'],
    ['BST & Heaps', 'Heaps', 'Min-heap root', 'Easy', 'Direct MCQ', 'In a min-heap, the smallest element is at:', ['The root', 'A leaf', 'The last level', 'Any position'], 0, 'The heap property keeps the minimum at the root.'],
    ['BST & Heaps', 'Heaps', 'Array storage', 'Medium', 'Numerical', 'In a 0-indexed heap array, the children of index i are at:', ['2i + 1 and 2i + 2', '2i and 2i + 1', 'i/2 and i + 1', 'i + 1 and i + 2'], 0, 'Children of node i are at 2i+1 and 2i+2 in 0-based arrays.'],
    ['BST & Heaps', 'Heaps', 'Delete min cost', 'Medium', 'Direct MCQ', 'Deleting the root of a heap and reheapifying costs:', ['O(log n)', 'O(1)', 'O(n)', 'O(n log n)'], 0, 'Heapify-down after removal takes O(log n).'],
    ['BST & Heaps', 'Heaps', 'Build heap cost', 'Hard', 'Statement Based', 'Statement: Building a heap from n elements takes O(n) time. This statement is:', ['True — the standard heapify analysis gives O(n)', 'False — it is O(n log n)', 'True — only with a priority queue', 'False — it is O(n²)'], 0, 'Bottom-up heapify is O(n); the common misconception is O(n log n).'],
    ['Graphs', 'Representations', 'Adjacency list', 'Easy', 'Direct MCQ', 'For a sparse graph, the most space-efficient representation is:', ['Adjacency list', 'Adjacency matrix', 'Incidence matrix always', 'Hash of edges only'], 0, 'Adjacency lists use O(V + E) space, ideal for sparse graphs.'],
    ['Graphs', 'Representations', 'Matrix space', 'Medium', 'Numerical', 'An adjacency matrix for a graph with V vertices uses:', ['O(V²) space', 'O(V) space', 'O(E) space', 'O(V + E) space'], 0, 'The matrix stores V² entries regardless of edge count.'],
    ['Graphs', 'BFS', 'Shortest paths', 'Medium', 'Application Based', 'BFS from a source vertex finds:', ['Shortest paths by number of edges in unweighted graphs', 'Shortest weighted paths', 'Minimum spanning trees', 'Strongly connected components'], 0, 'In unweighted graphs, BFS finds edge-count shortest paths.'],
    ['Graphs', 'BFS', 'Data structure', 'Easy', 'Direct MCQ', 'BFS uses a:', ['Queue', 'Stack', 'Recursion only', 'Heap'], 0, 'BFS explores level by level with a queue.'],
    ['Graphs', 'DFS', 'Cycle detection', 'Medium', 'Application Based', 'DFS is directly useful for:', ['Detecting cycles', 'Finding shortest unweighted paths', 'Sorting weights', 'Building MSTs only'], 0, 'DFS back-edges reveal cycles; it also powers topological sort and connectivity.'],
    ['Graph Algorithms', 'Shortest Paths', 'Dijkstra constraint', 'Medium', 'Statement Based', 'Statement: Dijkstra’s algorithm fails for graphs with negative edge weights. This statement is:', ['True — it assumes non-negative weights', 'False — it handles negatives', 'True — only with cycles', 'False — it is always optimal'], 0, 'Dijkstra greedily commits to settled distances, which fails with negative edges; Bellman-Ford handles them.'],
    ['Graph Algorithms', 'Shortest Paths', 'Bellman-Ford', 'Medium', 'Direct MCQ', 'Bellman-Ford detects:', ['Negative-weight cycles', 'Only positive cycles', 'Disconnected components', 'MST edges'], 0, 'The V-th relaxation pass reveals negative cycles.'],
    ['Graph Algorithms', 'Minimum Spanning Tree', 'Kruskal tool', 'Medium', 'Application Based', 'Kruskal’s algorithm builds an MST by:', ['Sorting edges by weight and using union-find', 'Growing from a source with a priority queue', 'Running BFS', 'Floyd-Warshall first'], 0, 'Kruskal sorts edges and adds them with union-find, skipping cycles.'],
  ],
})

/* ================================================================== */
/* 11 · University — DBMS: Normalization & SQL (20)                    */
/* ================================================================== */
export const dbmsPool = buildStudioPools({
  sourceId: 'SRC-UNI-CS502-DBMS-011', domain: 'University', exam: null, subject: 'Database Management Systems', chapter: 'Normalization & SQL',
  rows: [
    ['Functional Dependencies', 'Definition', 'Meaning', 'Easy', 'Direct MCQ', 'X → Y is a functional dependency meaning:', ['Each X value determines exactly one Y value', 'Y determines X', 'X and Y are equal', 'Y is a key'], 0, 'A functional dependency X → Y means every X value maps to a single Y value.'],
    ['Functional Dependencies', 'Closure', 'Attribute closure', 'Medium', 'Application Based', 'Given FDs A → B and B → C, the closure of {A} is:', ['{A, B, C}', '{A, B}', '{A, C}', '{B, C}'], 0, 'A → B and B → C imply A → C by transitivity, so A⁺ = {A, B, C}.'],
    ['Functional Dependencies', 'Candidate Keys', 'Definition', 'Medium', 'Direct MCQ', 'A candidate key is:', ['A minimal set of attributes whose closure is the whole relation', 'Any primary key plus one', 'A foreign key', 'A non-null attribute'], 0, 'Candidate keys are minimal superkeys — their closure is the full relation.'],
    ['Functional Dependencies', 'Candidate Keys', 'Finding keys', 'Medium', 'Statement Based', 'Statement: The primary key is chosen from the candidate keys. This statement is:', ['True', 'False — it is always the first column', 'True — only for composite keys', 'False — it is a foreign key'], 0, 'One candidate key is designated as the primary key.'],
    ['Normal Forms', '1NF', 'Atomic values', 'Easy', 'Direct MCQ', 'A relation is in 1NF when:', ['All attributes are atomic', 'No transitive dependencies', 'Every column is a key', 'It has no nulls'], 0, 'First normal form requires atomic (indivisible) attribute values.'],
    ['Normal Forms', '2NF', 'Partial dependency', 'Medium', 'Direct MCQ', 'A relation in 2NF has:', ['No partial dependencies on any candidate key', 'No transitive dependencies', 'All keys single-attribute', 'No foreign keys'], 0, '2NF removes partial dependencies; 3NF removes transitive dependencies.'],
    ['Normal Forms', '3NF', 'Transitive dependency', 'Medium', 'Application Based', 'A relation with A → B and B → C (B not a key) violates:', ['3NF', '1NF', '2NF only', 'No normal form'], 0, 'A transitive dependency on a non-key attribute violates 3NF.'],
    ['Normal Forms', 'BCNF', 'Stricter than 3NF', 'Medium', 'Assertion & Reason', '', AR_OPTIONS, 0, '', 1, 0, { assertion: 'Every BCNF relation is in 3NF.', reason: 'BCNF requires every nontrivial FD to have a superkey left side, which is stricter than 3NF.' }],
    ['Normal Forms', 'BCNF', 'Violation', 'Hard', 'Application Based', 'Which FD pattern can violate BCNF even in a 3NF relation?', ['A non-superkey determining a subset of attributes', 'A key determining everything', 'Only null values', 'A single-attribute key'], 0, 'A nontrivial FD whose left side is not a superkey violates BCNF.'],
    ['Normal Forms', '2NF', 'Composite key case', 'Medium', 'Statement Based', 'Statement: A relation with only single-attribute keys is always in 2NF. This statement is:', ['True — partial dependencies need composite keys', 'False — it may still violate 2NF', 'True — only with nulls', 'False — keys are irrelevant'], 0, 'Partial dependencies can only exist with composite candidate keys, so single-key relations are in 2NF.'],
    ['SQL', 'Queries', 'WHERE vs HAVING', 'Medium', 'Direct MCQ', 'The HAVING clause is used to filter:', ['Groups created by GROUP BY', 'Individual rows', 'Columns', 'Tables'], 0, 'HAVING filters aggregated groups; WHERE filters rows before grouping.'],
    ['SQL', 'Queries', 'DISTINCT', 'Easy', 'Direct MCQ', 'SELECT DISTINCT city FROM students returns:', ['Unique city values', 'All rows', 'City counts', 'The first city'], 0, 'DISTINCT removes duplicate rows from the result.'],
    ['SQL', 'Joins', 'LEFT JOIN', 'Medium', 'Application Based', 'A LEFT JOIN returns:', ['All left-table rows with matches or NULLs on the right', 'Only matching rows', 'The Cartesian product', 'Only right-table rows'], 0, 'LEFT JOIN keeps every left row, filling unmatched right columns with NULL.'],
    ['SQL', 'Joins', 'INNER JOIN', 'Easy', 'Direct MCQ', 'An INNER JOIN returns:', ['Only rows matching in both tables', 'All rows of both tables', 'Only left rows', 'Rows with NULLs'], 0, 'INNER JOIN keeps only matching rows from both tables.'],
    ['SQL', 'Aggregation', 'COUNT(*)', 'Easy', 'Numerical', 'A table has 100 rows, 10 with NULL in column grade. SELECT COUNT(grade) returns:', ['90', '100', '10', '0'], 0, 'COUNT(column) ignores NULLs; COUNT(*) counts all rows.'],
    ['SQL', 'Aggregation', 'GROUP BY', 'Medium', 'Application Based', 'SELECT dept, AVG(salary) FROM emp GROUP BY dept gives:', ['Average salary per department', 'Total salary', 'The largest department', 'All salaries'], 0, 'GROUP BY dept aggregates salary averages per department.'],
    ['Transactions', 'ACID', 'Properties', 'Easy', 'Direct MCQ', 'ACID stands for:', ['Atomicity, Consistency, Isolation, Durability', 'Atomicity, Concurrency, Isolation, Data', 'Access, Consistency, Integrity, Durability', 'Atomicity, Consistency, Integrity, Data'], 0, 'ACID = Atomicity, Consistency, Isolation, Durability.'],
    ['Transactions', 'Isolation Levels', 'Dirty read', 'Medium', 'Direct MCQ', 'A dirty read occurs when a transaction reads:', ['Uncommitted data from another transaction', 'Committed data only', 'Its own writes', 'An index'], 0, 'READ UNCOMMITTED permits dirty reads of uncommitted data.'],
    ['Transactions', 'Isolation Levels', 'SERIALIZABLE', 'Medium', 'Statement Based', 'Statement: SERIALIZABLE is the strongest standard isolation level. This statement is:', ['True — it prevents dirty, non-repeatable and phantom reads', 'False — READ COMMITTED is stronger', 'True — but it never blocks', 'False — it is the weakest'], 0, 'SERIALIZABLE executes transactions as if serialised, eliminating all three anomalies.'],
    ['Transactions', 'Concurrency', '2PL', 'Medium', 'Application Based', 'Two-phase locking (2PL) guarantees:', ['Conflict serialisability', 'Deadlock freedom', 'No waiting', 'Strict isolation only'], 0, '2PL ensures a serialisable schedule; deadlock handling is separate.'],
  ],
})

/* ================================================================== */
/* 12 · University — Operating Systems: Process Management (20)        */
/* ================================================================== */
export const osProcessPool = buildStudioPools({
  sourceId: 'SRC-UNI-CS503-OS-012', domain: 'University', exam: null, subject: 'Operating Systems', chapter: 'Process Management',
  rows: [
    ['Processes', 'Process States', 'States', 'Easy', 'Direct MCQ', 'Which is NOT a typical process state?', ['Compiled', 'Running', 'Ready', 'Blocked'], 0, 'New, Ready, Running, Blocked and Terminated are the standard states.'],
    ['Processes', 'PCB', 'Contents', 'Medium', 'Direct MCQ', 'The Process Control Block (PCB) stores:', ['Registers, PC, memory and file information', 'Only the process name', 'The source code', 'The page cache'], 0, 'The PCB holds execution context, scheduling, memory and I/O information.'],
    ['Processes', 'Context Switch', 'Overhead', 'Medium', 'Statement Based', 'Statement: A context switch is pure overhead with no useful work done. This statement is:', ['True — it only saves and restores state', 'False — it executes user code', 'True — only for threads', 'False — it is free'], 0, 'Context switching saves/loads state without doing application work.'],
    ['Processes', 'Process States', 'Waiting transition', 'Medium', 'Application Based', 'A running process that requests an I/O operation moves to:', ['Blocked (waiting)', 'Ready', 'Terminated', 'New'], 0, 'I/O requests block the process until the operation completes.'],
    ['Threads', 'Thread Models', 'Shared memory', 'Easy', 'Direct MCQ', 'Threads within the same process share:', ['The address space', 'Registers only', 'Page tables only', 'Nothing'], 0, 'Threads share code, data and heap, with private stacks and registers.'],
    ['Threads', 'Thread Models', 'Context switch cost', 'Medium', 'Statement Based', 'Statement: Switching between threads is cheaper than between processes. This statement is:', ['True — threads share an address space', 'False — it is identical', 'True — only for kernel threads', 'False — it is slower'], 0, 'Thread switches skip address-space switches, reducing overhead.'],
    ['CPU Scheduling', 'FCFS', 'Convoy effect', 'Medium', 'Direct MCQ', 'The convoy effect is classically associated with:', ['FCFS', 'SJF', 'Round Robin', 'Priority scheduling'], 0, 'A long job holds the CPU while short jobs queue behind it in FCFS.'],
    ['CPU Scheduling', 'SJF', 'Optimality', 'Medium', 'Direct MCQ', 'SJF (non-preemptive) minimises:', ['Average waiting time', 'Response time always', 'Throughput', 'Context switches'], 0, 'SJF minimises average waiting time among non-preemptive policies.'],
    ['CPU Scheduling', 'Round Robin', 'Time quantum', 'Medium', 'Numerical', 'With 5 processes and a time quantum of 10 ms, the maximum waiting time of a process is roughly:', ['40 ms', '10 ms', '50 ms', '5 ms'], 0, 'A process waits at most (n − 1) × q = 40 ms before its next turn.'],
    ['CPU Scheduling', 'Round Robin', 'Quantum effect', 'Medium', 'Statement Based', 'Statement: A very small time quantum increases context-switch overhead. This statement is:', ['True', 'False — overhead decreases', 'True — only for SJF', 'False — quantum has no effect'], 0, 'Tiny quanta cause excessive context switching; huge quanta make RR degrade to FCFS.'],
    ['CPU Scheduling', 'Priority', 'Starvation', 'Medium', 'Application Based', 'Low-priority processes can starve under priority scheduling; the usual fix is:', ['Aging (gradually raising priority)', 'Increasing the quantum', 'Using FCFS only', 'Removing the ready queue'], 0, 'Aging raises the priority of waiting processes over time, preventing starvation.'],
    ['CPU Scheduling', 'FCFS', 'Preemptive?', 'Easy', 'Direct MCQ', 'FCFS is a:', ['Non-preemptive policy', 'Preemptive policy', 'Random policy', 'Batch-only policy'], 0, 'FCFS runs each job to completion or blocking without preemption.'],
    ['Synchronisation & Deadlock', 'Semaphores', 'Mutex', 'Easy', 'Direct MCQ', 'A binary semaphore used to guard a critical section is called a:', ['Mutex', 'Counting semaphore', 'Monitor only', 'Spinlock only'], 0, 'A mutex is a binary semaphore protecting a critical section.'],
    ['Synchronisation & Deadlock', 'Semaphores', 'P and V', 'Medium', 'Direct MCQ', 'The wait (P) operation on a semaphore:', ['Decrements the count, blocking if negative', 'Increments the count', 'Always returns immediately', 'Destroys the semaphore'], 0, 'P decrements and blocks when the count would go negative; V increments.'],
    ['Synchronisation & Deadlock', 'Classic Problems', 'Producer-consumer', 'Medium', 'Numerical', 'The bounded-buffer producer–consumer solution needs how many semaphores?', ['3', '1', '2', '4'], 0, 'A mutex plus empty and full counting semaphores — three in total.'],
    ['Synchronisation & Deadlock', 'Deadlock Conditions', 'Four conditions', 'Medium', 'Multiple Statement', 'Which are necessary for deadlock?\nI. Mutual exclusion\nII. Hold and wait\nIII. No preemption\nIV. Circular wait', ['All four', 'I, II and III only', 'II, III and IV only', 'I and II only'], 0, 'All four conditions — mutual exclusion, hold-and-wait, no preemption and circular wait — are necessary.'],
    ['Synchronisation & Deadlock', 'Deadlock Conditions', 'Prevention', 'Medium', 'Application Based', 'Breaking which condition prevents deadlock by requiring processes to request all resources at once?', ['Hold and wait', 'Mutual exclusion', 'No preemption', 'Circular wait'], 0, 'Requesting all resources upfront eliminates hold-and-wait.'],
    ['Synchronisation & Deadlock', 'Deadlock Conditions', 'Banker’s algorithm', 'Medium', 'Direct MCQ', 'The banker’s algorithm is a deadlock:', ['Avoidance method', 'Prevention method', 'Detection method', 'Recovery method'], 0, 'The banker’s algorithm avoids deadlock by only granting safe requests.'],
    ['Synchronisation & Deadlock', 'Deadlock Conditions', 'Resource graph', 'Medium', 'Statement Based', 'Statement: With single-instance resources, a cycle in the resource-allocation graph implies deadlock. This statement is:', ['True', 'False — cycles never occur', 'True — only for two processes', 'False — cycles imply livelock'], 0, 'For single-instance resources, a cycle is both necessary and sufficient for deadlock.'],
    ['CPU Scheduling', 'SJF', 'SRTF', 'Medium', 'Application Based', 'The preemptive SJF policy is also called:', ['SRTF (Shortest Remaining Time First)', 'HRRN', 'MLFQ', 'Lottery scheduling'], 0, 'Preemptive SJF is SRTF — preemption occurs when a shorter job arrives.'],
  ],
})

/* ------------------------------------------------------------------ */
/* Aggregate                                                           */
/* ------------------------------------------------------------------ */
export const questionStudioPools = {
  'SRC-BIO-BIOMOL-001': biomoleculesPool,
  'SRC-BIO-DIGEST-002': digestionPool,
  'SRC-PHY-LAWS-003': lawsOfMotionPool,
  'SRC-PHY-WEP-004': workEnergyPowerPool,
  'SRC-CHE-BOND-005': chemicalBondingPool,
  'SRC-CHE-ORGCHEM-006': organicBasicsPool,
  'SRC-JEE-PHY-KIN-007': kinematicsPool,
  'SRC-JEE-MAT-LIM-008': limitsPool,
  'SRC-NEET-BIO-PHYS-009': humanPhysiologyPool,
  'SRC-UNI-CS501-TREES-010': treesGraphsPool,
  'SRC-UNI-CS502-DBMS-011': dbmsPool,
  'SRC-UNI-CS503-OS-012': osProcessPool,
}

export const allStudioQuestions = Object.values(questionStudioPools).flat()

export default { questionStudioPools, allStudioQuestions }
