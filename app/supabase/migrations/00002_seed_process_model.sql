-- =============================================
-- Volve: Seed Data for "Geschäftsidee realisieren" Process Model
-- =============================================

-- Process Model
INSERT INTO process_models (id, name, description, icon) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Geschäftsidee realisieren',
  'Strukturiertes Vorgehen von der ersten Idee bis zur Umsetzung. 7 Stufen führen durch Vision, Analyse, Planung und Rollout.',
  'rocket'
);

-- =============================================
-- Stage 1: Der Funke
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Der Funke',
  'Die rohe Idee wird erfasst und konsolidiert.',
  'sparkles',
  0
);

-- Step 1.1: Seed konsolidieren
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Seed konsolidieren',
  'Zusammenführung und Bereinigung aller Seed-Dokumente zu einem strukturierten Ausgangsdokument',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Konsolidiertes Quelldokument',
  'long_text',
  'Strukturierte Zusammenfassung aller Eingangsdokumente',
  'Du bist ein Strukturierungs-Assistent. Analysiere die folgenden Seed-Dokumente und erstelle daraus ein klar strukturiertes, bereinigtes Markdown-Dokument. Fasse zusammen, entferne Redundanzen, korrigiere offensichtliche Fehler und bringe die Informationen in eine logische Reihenfolge. Bewahre alle wesentlichen Inhalte und Ideen.',
  0,
  '{}'
);

-- =============================================
-- Stage 2: Die Vision
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Die Vision',
  'Die Idee wird aus verschiedenen Perspektiven betrachtet, um ein umfassendes Verständnis zu entwickeln.',
  'eye',
  1
);

-- Step 2.1: Visionsbeschreibung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Visionsbeschreibung',
  'Formulierung der übergeordneten Vision und eines kompakten Elevator Pitchs',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'Vision Statement',
  'long_text',
  'Übergeordnete Vision der Geschäftsidee',
  'Erstelle ein inspirierendes Vision Statement für diese Geschäftsidee. Das Statement sollte klar, motivierend und zukunftsorientiert sein. Beschreibe die langfristige Wirkung und den Mehrwert, den diese Idee schaffen soll. Formuliere in der Ich/Wir-Form und in 2-4 Absätzen.',
  0,
  '{30000000-0000-0000-0000-000000000001}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'Elevator Pitch',
  'text',
  'Kompakte Zusammenfassung in 1-2 Sätzen',
  'Formuliere einen prägnanten Elevator Pitch (maximal 2 Sätze), der diese Geschäftsidee in 30 Sekunden verständlich macht. Der Pitch sollte das Problem, die Lösung und den einzigartigen Vorteil enthalten.',
  1,
  '{30000000-0000-0000-0000-000000000002}'
);

-- Step 2.2: Namensgebung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'Namensgebung',
  'Namensfindung und -bewertung',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000003',
  'Projektname',
  'text',
  'Gewählter Name für das Projekt',
  NULL,
  0,
  '{}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000003',
  'Namensalternativen',
  'long_text',
  'Alternative Namensvorschläge mit Bewertung',
  'Generiere 5-8 kreative Namensvorschläge für dieses Projekt. Berücksichtige dabei: Merkbarkeit, Domain-Verfügbarkeit (Einschätzung), internationale Verständlichkeit, Bezug zur Kernidee. Bewerte jeden Vorschlag kurz mit Pro/Contra.',
  1,
  '{30000000-0000-0000-0000-000000000002}'
);

-- Step 2.3: Einordnung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000002',
  'Einordnung',
  'Zeitliche und thematische Verortung der Idee',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000004',
  'Domäne',
  'text',
  'Hauptdomäne der Geschäftsidee',
  'Identifiziere die Hauptdomäne/Branche, in der diese Geschäftsidee angesiedelt ist. Nenne eine primäre Domäne und optional 1-2 sekundäre Domänen. Format: "Primär: [Domäne]. Sekundär: [Domäne 1], [Domäne 2]".',
  0,
  '{30000000-0000-0000-0000-000000000002}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000007',
  '20000000-0000-0000-0000-000000000004',
  'Horizontdimension',
  'text',
  'Zeithorizont: Woche / Monat / Jahr / Jahrzehnt',
  NULL,
  1,
  '{}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000008',
  '20000000-0000-0000-0000-000000000004',
  'Priorität',
  'text',
  'Priorität: Hoch / Mittel / Niedrig',
  NULL,
  2,
  '{}'
);

-- =============================================
-- Stage 3: Research & Segmentierung
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Research & Segmentierung',
  'Erste systematische Analyse des Umfelds.',
  'search',
  2
);

-- Step 3.1: Thematische Gliederung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000003',
  'Thematische Gliederung',
  'Zerlegung der Idee in thematische Teilbereiche',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000009',
  '20000000-0000-0000-0000-000000000005',
  'Themenfelder',
  'long_text',
  'Thematische Teilbereiche der Geschäftsidee',
  'Analysiere die Geschäftsidee und identifiziere die wichtigsten thematischen Teilbereiche. Strukturiere diese hierarchisch und beschreibe für jeden Bereich kurz: Was umfasst er? Warum ist er relevant? Welche Unterthemen gibt es? Erstelle eine übersichtliche Markdown-Liste.',
  0,
  '{30000000-0000-0000-0000-000000000001}'
);

-- Step 3.2: Zielgruppenanalyse
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000003',
  'Zielgruppenanalyse',
  'Identifikation und Beschreibung der Zielgruppen',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000010',
  '20000000-0000-0000-0000-000000000006',
  'Primäre Zielgruppe',
  'long_text',
  'Hauptzielgruppe mit Profil und Bedürfnissen',
  'Beschreibe die primäre Zielgruppe für diese Geschäftsidee. Erstelle ein detailliertes Profil mit: Demografie, Psychografie, Schmerzpunkte/Bedürfnisse, aktuelles Verhalten, wie diese Idee ihr Leben verbessert. Nutze das Format einer Persona.',
  0,
  '{30000000-0000-0000-0000-000000000009}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000011',
  '20000000-0000-0000-0000-000000000006',
  'Sekundäre Zielgruppen',
  'long_text',
  'Weitere relevante Zielgruppen',
  'Identifiziere 2-3 sekundäre Zielgruppen, die von dieser Geschäftsidee profitieren könnten. Beschreibe für jede: Wer sind sie? Warum sind sie relevant? Wie unterscheidet sich ihr Bedarf von der primären Zielgruppe?',
  1,
  '{30000000-0000-0000-0000-000000000010}'
);

-- Step 3.3: Marktrecherche
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000003',
  'Marktrecherche',
  'Erste Markteinschätzung und Quellensammlung',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000012',
  '20000000-0000-0000-0000-000000000007',
  'Marktüberblick',
  'long_text',
  'Überblick über den relevanten Markt',
  'Erstelle einen Marktüberblick für diese Geschäftsidee. Behandle: Marktgröße (geschätzt), Wachstumstrends, relevante Marktsegmente, regulatorisches Umfeld, technologische Trends. Nutze eine klare Struktur mit Überschriften.',
  0,
  '{30000000-0000-0000-0000-000000000009, 30000000-0000-0000-0000-000000000010}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000013',
  '20000000-0000-0000-0000-000000000007',
  'Relevante Quellen',
  'long_text',
  'Quellensammlung für die Marktrecherche',
  NULL,
  1,
  '{}'
);

-- =============================================
-- Stage 4: SWOT-Analyse
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'SWOT-Analyse',
  'Systematische Analyse von Stärken, Schwächen, Chancen und Risiken.',
  'target',
  3
);

-- Step 4.1: Stärken
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000004',
  'Stärken (Strengths)',
  'Interne Stärken identifizieren',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000014',
  '20000000-0000-0000-0000-000000000008',
  'Stärken-Analyse',
  'long_text',
  'Analyse der internen Stärken',
  'Analysiere die internen Stärken dieser Geschäftsidee. Berücksichtige: Alleinstellungsmerkmale, vorhandene Ressourcen und Kompetenzen, technologische Vorteile, Marktpositionierung. Strukturiere die Analyse in klar benannte Stärken mit jeweils einer Erklärung.',
  0,
  '{30000000-0000-0000-0000-000000000002, 30000000-0000-0000-0000-000000000009}'
);

-- Step 4.2: Schwächen
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000004',
  'Schwächen (Weaknesses)',
  'Interne Schwächen identifizieren',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000015',
  '20000000-0000-0000-0000-000000000009',
  'Schwächen-Analyse',
  'long_text',
  'Analyse der internen Schwächen',
  'Identifiziere ehrlich die internen Schwächen und Herausforderungen dieser Geschäftsidee. Berücksichtige: Fehlende Ressourcen, Wissenslücken, potenzielle Engpässe, Marktbarrieren. Sei konstruktiv – benenne die Schwäche und skizziere mögliche Gegenmaßnahmen.',
  0,
  '{30000000-0000-0000-0000-000000000002, 30000000-0000-0000-0000-000000000009}'
);

-- Step 4.3: Chancen
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000004',
  'Chancen (Opportunities)',
  'Externe Chancen identifizieren',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000016',
  '20000000-0000-0000-0000-000000000010',
  'Chancen-Analyse',
  'long_text',
  'Analyse der externen Chancen',
  'Identifiziere die externen Chancen für diese Geschäftsidee basierend auf der Marktrecherche. Berücksichtige: Markttrends, technologische Entwicklungen, regulatorische Veränderungen, gesellschaftliche Trends, Partnerschaftsmöglichkeiten.',
  0,
  '{30000000-0000-0000-0000-000000000012}'
);

-- Step 4.4: Risiken
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000004',
  'Risiken (Threats)',
  'Externe Risiken identifizieren',
  3
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000017',
  '20000000-0000-0000-0000-000000000011',
  'Risiken-Analyse',
  'long_text',
  'Analyse der externen Risiken',
  'Identifiziere die externen Risiken und Bedrohungen für diese Geschäftsidee. Berücksichtige: Wettbewerb, Marktrisiken, technologische Disruption, regulatorische Risiken, wirtschaftliche Unsicherheiten. Bewerte die Eintrittswahrscheinlichkeit und den potenziellen Impact.',
  0,
  '{30000000-0000-0000-0000-000000000012}'
);

-- Step 4.5: SWOT-Synthese
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000012',
  '10000000-0000-0000-0000-000000000004',
  'SWOT-Synthese',
  'Zusammenführung und strategische Ableitung',
  4
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000018',
  '20000000-0000-0000-0000-000000000012',
  'SWOT-Matrix',
  'long_text',
  'Zusammenfassende SWOT-Matrix',
  'Erstelle eine übersichtliche SWOT-Matrix als Markdown-Tabelle basierend auf den vier Teilanalysen. Fasse die jeweils wichtigsten 3-5 Punkte zusammen. Formatiere als 2x2-Matrix mit Stärken/Schwächen (intern) und Chancen/Risiken (extern).',
  0,
  '{30000000-0000-0000-0000-000000000014, 30000000-0000-0000-0000-000000000015, 30000000-0000-0000-0000-000000000016, 30000000-0000-0000-0000-000000000017}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000019',
  '20000000-0000-0000-0000-000000000012',
  'Strategische Implikationen',
  'long_text',
  'Strategische Schlussfolgerungen aus der SWOT-Analyse',
  'Leite aus der SWOT-Matrix konkrete strategische Implikationen ab. Nutze das TOWS-Schema: SO-Strategien (Stärken nutzen, um Chancen zu ergreifen), WO-Strategien (Schwächen überwinden durch Chancen), ST-Strategien (Stärken nutzen gegen Risiken), WT-Strategien (Schwächen minimieren, Risiken vermeiden).',
  1,
  '{30000000-0000-0000-0000-000000000018}'
);

-- =============================================
-- Stage 5: Businessplan
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Businessplan',
  'Umfassende Ausarbeitung aller geschäftsrelevanten Aspekte.',
  'briefcase',
  4
);

-- Step 5.1: Geschäftsmodell
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000013',
  '10000000-0000-0000-0000-000000000005',
  'Geschäftsmodell',
  'Kernstruktur des Geschäftsmodells',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000020',
  '20000000-0000-0000-0000-000000000013',
  'Business Model Canvas',
  'long_text',
  'Geschäftsmodell im Canvas-Format',
  'Erstelle ein vollständiges Business Model Canvas für diese Geschäftsidee. Strukturiere es in die 9 Bausteine: Kundensegmente, Wertversprechen, Kanäle, Kundenbeziehungen, Einnahmequellen, Schlüsselressourcen, Schlüsselaktivitäten, Schlüsselpartnerschaften, Kostenstruktur. Fülle jeden Baustein mit konkreten Inhalten basierend auf den bisherigen Analysen.',
  0,
  '{30000000-0000-0000-0000-000000000002, 30000000-0000-0000-0000-000000000019}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000021',
  '20000000-0000-0000-0000-000000000013',
  'Wertversprechen',
  'long_text',
  'Detailliertes Wertversprechen (Value Proposition)',
  'Formuliere ein detailliertes Wertversprechen (Value Proposition) für diese Geschäftsidee. Nutze das Value Proposition Canvas: Kundenjobs, Pains, Gains auf der Kundenseite. Pain Relievers, Gain Creators, Products & Services auf der Angebotsseite. Zeige klar den Fit zwischen Kundenbedürfnissen und Angebot.',
  1,
  '{30000000-0000-0000-0000-000000000020}'
);

-- Step 5.2: Wettbewerbsanalyse
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000014',
  '10000000-0000-0000-0000-000000000005',
  'Wettbewerbsanalyse',
  'Vierstufige Wettbewerbsanalyse-Chain',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000022',
  '20000000-0000-0000-0000-000000000014',
  'Wettbewerberliste',
  'long_text',
  'Identifikation der wichtigsten Wettbewerber',
  'Identifiziere die 5-10 wichtigsten Wettbewerber für diese Geschäftsidee. Berücksichtige direkte und indirekte Wettbewerber. Liste für jeden: Name, Kernprodukt, Zielgruppe, geschätzte Marktposition. Formatiere als übersichtliche Markdown-Tabelle.',
  0,
  '{30000000-0000-0000-0000-000000000012}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000023',
  '20000000-0000-0000-0000-000000000014',
  'Detailanalyse',
  'long_text',
  'Detaillierte Analyse der Top-Wettbewerber',
  'Führe eine detaillierte Analyse der Top-5-Wettbewerber aus der Liste durch. Für jeden: Stärken, Schwächen, Differenzierung, Preismodell, technologischer Ansatz, Kundenbewertungen. Identifiziere Muster und Lücken im Markt.',
  1,
  '{30000000-0000-0000-0000-000000000022}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000024',
  '20000000-0000-0000-0000-000000000014',
  'Bewertung Wettbewerbsumfeld',
  'long_text',
  'Bewertung des gesamten Wettbewerbsumfelds',
  'Bewerte das gesamte Wettbewerbsumfeld basierend auf der Detailanalyse. Nutze Porters Five Forces: Bedrohung durch neue Anbieter, Verhandlungsmacht der Lieferanten, Verhandlungsmacht der Kunden, Bedrohung durch Substitute, Rivalität bestehender Wettbewerber. Bewerte jede Kraft auf einer Skala (niedrig/mittel/hoch).',
  2,
  '{30000000-0000-0000-0000-000000000023}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000025',
  '20000000-0000-0000-0000-000000000014',
  'Zusammenfassung Wettbewerb',
  'long_text',
  'Zusammenfassung und Positionierungsempfehlung',
  'Fasse die Wettbewerbsanalyse zusammen und leite eine klare Positionierungsempfehlung ab. Wo liegt die größte Chance zur Differenzierung? Welche Wettbewerbsvorteile sollten ausgebaut werden? Welche Risiken bestehen?',
  3,
  '{30000000-0000-0000-0000-000000000024}'
);

-- Step 5.3: Finanzplanung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000015',
  '10000000-0000-0000-0000-000000000005',
  'Finanzplanung',
  'Finanzielle Eckpfeiler',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000026',
  '20000000-0000-0000-0000-000000000015',
  'Kostenstruktur',
  'long_text',
  'Aufschlüsselung der erwarteten Kosten',
  'Erstelle eine detaillierte Kostenstruktur für diese Geschäftsidee. Unterscheide zwischen Fixkosten und variablen Kosten. Gliedere in Kategorien: Personal, Technologie/Infrastruktur, Marketing, Rechtliches, Sonstiges. Schätze monatliche und jährliche Kosten für die ersten 2 Jahre.',
  0,
  '{30000000-0000-0000-0000-000000000020}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000027',
  '20000000-0000-0000-0000-000000000015',
  'Erlösmodell',
  'long_text',
  'Beschreibung der Einnahmequellen',
  'Beschreibe das Erlösmodell für diese Geschäftsidee. Definiere: Einnahmequellen (Subscription, Einmalkauf, Freemium, etc.), Preispunkte, erwartete Conversion Rates, Customer Lifetime Value. Erstelle eine realistische Umsatzprognose für die ersten 2 Jahre.',
  1,
  '{30000000-0000-0000-0000-000000000020}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000028',
  '20000000-0000-0000-0000-000000000015',
  'Pricing-Strategie',
  'long_text',
  'Preisgestaltung und -strategie',
  'Entwickle eine Pricing-Strategie basierend auf der Wettbewerbsanalyse und dem Erlösmodell. Berücksichtige: Wettbewerbspreise, Zahlungsbereitschaft der Zielgruppe, Wertbasierte vs. kostenbasierte Preisgestaltung, Einstiegsangebote, Staffelpreise.',
  2,
  '{30000000-0000-0000-0000-000000000025, 30000000-0000-0000-0000-000000000027}'
);

-- Step 5.4: Rechtliche Aspekte
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000016',
  '10000000-0000-0000-0000-000000000005',
  'Rechtliche Aspekte',
  'Juristische Rahmenbedingungen',
  3
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000029',
  '20000000-0000-0000-0000-000000000016',
  'Regulatorische Anforderungen',
  'long_text',
  'Relevante Vorschriften und Regulierungen',
  'Identifiziere die relevanten regulatorischen Anforderungen für diese Geschäftsidee. Berücksichtige: Branchenspezifische Regulierungen, Datenschutz (DSGVO), Verbraucherschutz, steuerliche Aspekte, Lizenzen und Genehmigungen. Differenziere nach DACH-Region.',
  0,
  '{30000000-0000-0000-0000-000000000006}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000030',
  '20000000-0000-0000-0000-000000000016',
  'Rechtsform-Empfehlung',
  'long_text',
  'Empfehlung zur Rechtsform',
  'Empfehle eine geeignete Rechtsform für dieses Vorhaben. Vergleiche die relevanten Optionen (Einzelunternehmen, GbR, UG, GmbH, etc.) hinsichtlich: Haftung, Gründungsaufwand, Kosten, steuerliche Aspekte, Außenwirkung. Gib eine klare Empfehlung mit Begründung.',
  1,
  '{30000000-0000-0000-0000-000000000029}'
);

-- =============================================
-- Stage 6: Maßnahmenplan
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Maßnahmenplan',
  'Überführung der Analyse in konkrete Handlungsschritte.',
  'list-checks',
  5
);

-- Step 6.1: Meilensteinplanung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000017',
  '10000000-0000-0000-0000-000000000006',
  'Meilensteinplanung',
  'Definition der zentralen Meilensteine mit Zeithorizont',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000031',
  '20000000-0000-0000-0000-000000000017',
  'Meilensteine',
  'long_text',
  'Zentrale Meilensteine mit Zeithorizont',
  'Definiere die zentralen Meilensteine für die Umsetzung dieser Geschäftsidee. Erstelle eine Timeline mit: Meilensteinname, Beschreibung, Zeithorizont (Monat/Quartal), Erfolgskriterien, Abhängigkeiten. Decke die ersten 12-18 Monate ab. Strukturiere chronologisch.',
  0,
  '{30000000-0000-0000-0000-000000000020}'
);

-- Step 6.2: Aufgabenplanung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000018',
  '10000000-0000-0000-0000-000000000006',
  'Aufgabenplanung',
  'Konkrete, delegierbare Aufgaben mit Assignees',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000032',
  '20000000-0000-0000-0000-000000000018',
  'Gründungsaufgaben',
  'task',
  'Aufgaben für die Unternehmensgründung',
  'Erstelle eine detaillierte Aufgabenbeschreibung für die Gründungsvorbereitungen: Rechtsform wählen, Businessplan finalisieren, Finanzierung sichern, Gewerbeanmeldung, etc.',
  0,
  '{30000000-0000-0000-0000-000000000031}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000033',
  '20000000-0000-0000-0000-000000000018',
  'Produktentwicklung',
  'task',
  'Aufgaben für die Produktentwicklung',
  'Erstelle eine detaillierte Aufgabenbeschreibung für die erste Produktentwicklungsphase: MVP definieren, Technologie-Stack festlegen, Entwicklung starten, erste Tests durchführen.',
  1,
  '{30000000-0000-0000-0000-000000000031}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000034',
  '20000000-0000-0000-0000-000000000018',
  'Marketing-Vorbereitung',
  'task',
  'Aufgaben für die Marketing-Vorbereitung',
  'Erstelle eine detaillierte Aufgabenbeschreibung für die Marketing-Vorbereitung: Branding, Website, Social Media Accounts, erste Kommunikationsstrategie, Launch-Plan.',
  2,
  '{30000000-0000-0000-0000-000000000031}'
);

-- Step 6.3: Ressourcenplanung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000019',
  '10000000-0000-0000-0000-000000000006',
  'Ressourcenplanung',
  'Personal, Finanzen, Infrastruktur',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000035',
  '20000000-0000-0000-0000-000000000019',
  'Benötigte Ressourcen',
  'long_text',
  'Übersicht aller benötigten Ressourcen',
  'Erstelle eine umfassende Ressourcenplanung: Personalbedarf (Rollen, Skills, Verfügbarkeit), technische Infrastruktur, externe Dienstleister, Büro/Arbeitsplatz, Software-Lizenzen. Priorisiere nach Dringlichkeit und Budget-Impact.',
  0,
  '{30000000-0000-0000-0000-000000000031, 30000000-0000-0000-0000-000000000026}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000036',
  '20000000-0000-0000-0000-000000000019',
  'Budgetübersicht',
  'long_text',
  'Zusammenfassende Budgetübersicht',
  'Erstelle eine Budgetübersicht, die Kostenstruktur und Ressourcenbedarf zusammenführt. Zeige: Gesamtinvestitionsbedarf, monatliche Burn Rate, Break-Even-Punkt (geschätzt), Finanzierungsbedarf. Nutze Tabellen für Übersichtlichkeit.',
  1,
  '{30000000-0000-0000-0000-000000000035, 30000000-0000-0000-0000-000000000026, 30000000-0000-0000-0000-000000000027}'
);

-- =============================================
-- Stage 7: Umsetzung & Rollout
-- =============================================
INSERT INTO stage_templates (id, model_id, name, description, icon, order_index) VALUES (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'Umsetzung & Rollout',
  'Begleitung der konkreten Realisierung.',
  'rocket',
  6
);

-- Step 7.1: Go/No-Go-Entscheidung
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000020',
  '10000000-0000-0000-0000-000000000007',
  'Go/No-Go-Entscheidung',
  'Finale Bewertung und Entscheidung',
  0
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000037',
  '20000000-0000-0000-0000-000000000020',
  'Entscheidungsvorlage',
  'long_text',
  'Zusammenfassende Entscheidungsvorlage',
  'Erstelle eine fundierte Go/No-Go-Entscheidungsvorlage. Fasse zusammen: Vision, Marktchance, SWOT-Kernpunkte, Geschäftsmodell, Finanzprognose, Risikobewertung. Erstelle eine Bewertungsmatrix mit Kriterien und Scoring. Gib eine klare Empfehlung mit Begründung.',
  0,
  '{30000000-0000-0000-0000-000000000019, 30000000-0000-0000-0000-000000000020, 30000000-0000-0000-0000-000000000036}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000038',
  '20000000-0000-0000-0000-000000000020',
  'Entscheidung',
  'text',
  'Go / No-Go / Bedingt Go',
  NULL,
  1,
  '{30000000-0000-0000-0000-000000000037}'
);

-- Step 7.2: Rollout-Plan
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000007',
  'Rollout-Plan',
  'Konkrete Umsetzungsplanung',
  1
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000039',
  '20000000-0000-0000-0000-000000000021',
  'Rollout-Phasen',
  'long_text',
  'Phasenplan für den Rollout',
  'Erstelle einen detaillierten Rollout-Phasenplan. Definiere 3-5 Phasen mit: Phasenname, Dauer, Ziele, Aktivitäten, Erfolgskriterien, Risiken. Beginne mit einem Soft Launch / Beta und steigere schrittweise.',
  0,
  '{30000000-0000-0000-0000-000000000031}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000040',
  '20000000-0000-0000-0000-000000000021',
  'Kommunikationsplan',
  'long_text',
  'Kommunikationsstrategie für den Rollout',
  'Erstelle einen Kommunikationsplan für den Rollout. Definiere: Zielgruppen (intern/extern), Kernbotschaften, Kanäle, Timing, Verantwortlichkeiten. Berücksichtige Pre-Launch, Launch und Post-Launch Kommunikation.',
  1,
  '{30000000-0000-0000-0000-000000000039}'
);

-- Step 7.3: Umsetzungsaufgaben
INSERT INTO step_templates (id, stage_template_id, name, description, order_index) VALUES (
  '20000000-0000-0000-0000-000000000022',
  '10000000-0000-0000-0000-000000000007',
  'Umsetzungsaufgaben',
  'Operative Aufgaben für den Rollout',
  2
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000041',
  '20000000-0000-0000-0000-000000000022',
  'Launch-Vorbereitung',
  'task',
  'Aufgaben für die Launch-Vorbereitung',
  'Erstelle eine detaillierte Aufgabenbeschreibung für die Launch-Vorbereitung: Letzte Tests, Content erstellen, Marketing-Materialien finalisieren, Team-Briefing, Go-Live Checkliste.',
  0,
  '{30000000-0000-0000-0000-000000000039}'
);

INSERT INTO field_templates (id, step_template_id, name, type, description, ai_prompt, order_index, dependencies) VALUES (
  '30000000-0000-0000-0000-000000000042',
  '20000000-0000-0000-0000-000000000022',
  'Post-Launch Monitoring',
  'task',
  'Aufgaben für das Post-Launch Monitoring',
  'Erstelle eine detaillierte Aufgabenbeschreibung für das Post-Launch Monitoring: KPIs definieren, Monitoring-Dashboard einrichten, Feedback sammeln, erste Iterationen planen, Support-Prozess aufsetzen.',
  1,
  '{30000000-0000-0000-0000-000000000041}'
);
