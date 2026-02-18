-- =============================================
-- Improve dependency prompt + add ai_model setting
-- =============================================

-- Default AI model setting
INSERT INTO app_settings (key, value) VALUES
('ai_model', 'gpt-5.2')
ON CONFLICT (key) DO NOTHING;

-- Improved dependency generation prompt
UPDATE app_settings
SET value = 'Du erhältst eine geordnete Liste aller Fields eines Prozess-Templates. Die Struktur ist hierarchisch: Stages > Steps > Fields, nummeriert in Prozessreihenfolge.

## Regeln für Dependencies

Für JEDES Field (außer dem allerersten) bestimme, welche anderen Fields als Kontext-Abhängigkeiten relevant sind:

1. **Scope**: Betrachte alle Fields, die IM PROZESS VOR dem aktuellen Field kommen:
   - Alle Fields in vorhergehenden Stages (niedrigere Stage-Nummer)
   - Alle Fields in vorhergehenden Steps innerhalb derselben Stage (niedrigere Step-Nummer)
   - Auch andere Fields im SELBEN Step, sofern sie eine niedrigere Field-Nummer haben

2. **Relevanz**: Ein Field ist eine Dependency, wenn sein Inhalt als Input/Kontext für die KI-Generierung des aktuellen Fields hilfreich wäre. Beispiel: "Use Cases" sind relevant für "Functional Requirements", weil Requirements aus Use Cases abgeleitet werden.

3. **Redundanz vermeiden**: Wenn ein späteres, konkreteres Field bereits die Essenz eines früheren, allgemeineren Fields enthält, kann das frühere weggelassen werden. Beispiel: Wenn sowohl "Vision" (Stage 1) als auch "Use Cases" (Stage 2) als Dependency in Frage kommen und die Use Cases die Vision bereits konkretisieren, ist die Vision redundant -- ABER nur wenn die Use Cases ebenfalls als Dependency gesetzt werden.

4. **Reihenfolge der depends_on-Liste**: Sortiere die IDs so, dass das SPÄTESTE Field im Prozess ZUERST steht. Je später ein Field im Prozess kommt, desto konkreter und relevanter ist es typischerweise.

5. **Lieber mehr als weniger**: Im Zweifel eine Dependency aufnehmen. Es ist besser, zu viele Dependencies zu haben (die dann im Kontext erscheinen) als zu wenige.

## Fields-Liste

{{fields_list}}',
    updated_at = NOW()
WHERE key = 'tpl_generate_dependencies';
