## Dev instructions

run this command: npx @langchain/langgraph-cli dev

INPUT PARAMETERS (JSON FORMAT)

## 1. Character Description

**FRONT END DESCRIPTION:** "Create a main character for our story by describing their appearance, personality, and a unique trait or quirk."

**Example:** "A tall, lanky teenager with wild blue hair who can't stop fidgeting. Despite being incredibly shy, they have an encyclopedic knowledge of stars and constellations that becomes surprisingly useful."

## 2. Plot Twist

**PFRONT END DESCRIPTIONrompt:** "Suggest an unexpected turn of events that could change the direction of our story halfway through."

**Example:** "The magical amulet that everyone has been searching for turns out to be a tracking device planted by the supposedly friendly mentor character, who has secretly been the villain all along."

## 3. Setting Description

**FRONT END DESCRIPTION:** "Describe a location where part of our story could take place. Include details about how it looks, sounds, and feels."

**Example:** "An abandoned amusement park where nature has begun to reclaim the rides. Vines twist through rusting roller coasters, and the faint melody of the carousel can sometimes be heard playing at midnight. The Ferris wheel creaks in the wind, and fog often clings to the ground."

## 4. Significant Prop

**FRONT END DESCRIPTION:** "Describe an object that will play an important role in our story. What does it look like and what special significance might it have?"

**Example:** "A pocket watch with constellations instead of numbers on its face. When opened under moonlight, the stars on the watch face glow and align to point toward hidden treasures. It was passed down through generations from a famous explorer."

## 5. Character Backstory

**FRONT END DESCRIPTION:** "Create a past event or history for a character that explains their current motivations or fears."

**Example:** "Before becoming the town's reclusive librarian, she was a world-famous detective who made one critical mistake that let a criminal mastermind escape. She now uses her analytical skills to organize books but panics whenever she has to make important decisions."

## 6. Atmospheric Conditions

**FRONT END DESCRIPTION:** "Describe the weather or atmospheric conditions that would create a specific mood for a key scene in our story."

**Example:** "A sudden, violent thunderstorm with purple-tinged lightning that illuminates the ancient statues in the garden, making them appear to move between flashes. The wind howls through the trees like whispered warnings."

## 7. Symbolic Motif

**FRONT END DESCRIPTION:** "Suggest a symbol or recurring element that could appear throughout our story to reinforce its themes."

**Example:** "Broken mirrors appear whenever a character faces a moment of truth about themselves. The fragments reflect different aspects of their personality, and how they respond to seeing these reflections drives their character development."

## 8. Special Ability

**FRONT END DESCRIPTION:** "Describe a unique power, skill, or ability that a character possesses. How does it work and what are its limitations?"

**Example:** "The ability to temporarily animate small inanimate objects by singing to them. The objects follow simple commands for about an hour before returning to normal. However, using this power drains the character's energy, and they can only animate objects smaller than a bread box."

## 9. Cultural Element

**FRONT END DESCRIPTION:** "Describe a cultural tradition, celebration, or belief system that shapes how characters in our story see the world."

**FRONT END DESCRIPTION:** "A harvest festival where everyone writes their regrets on paper lanterns and releases them into the night sky. It's believed that if your lantern flies the highest, your slate is wiped clean for the coming year. The entire town makes important decisions based on the lantern heights, and children are taught that honesty makes lanterns fly higher."

## 10. Technology Concept

**FRONT END DESCRIPTION:** "Describe a device, invention, or technological concept that exists in our story world. What does it do and how does it affect daily life?"

**Example:** "Memory glasses that can record and replay everything you see. Most people use them to create shareable 'life highlights,' but they've also eliminated most crime since anyone might be recording at any time. Some people have started an underground 'reality movement' where they refuse to wear the glasses."

{
"audience_inputs": [
{
"category": "character",
"description": "A retired astronaut in her 70s who still wears parts of her space suit as everyday clothing. She carries a small plant grown from seeds she secretly brought back from another planet."
},
{
"category": "character",
"description": "A 12-year-old boy with the ability to speak with insects. He's painfully shy around humans but confidently commands armies of beetles and butterflies when nobody's watching."
},
{
"category": "character",
"description": "A sentienta cloud of fog that can condense into a humanoid form for brief periods. It's fascinated by human emotions but doesn't fully understand them."
},
{
"category": "character",
"description": "A cybernetic detective with a mechanical right arm and a digital memory system. He has perfect recall of evidence but struggles to remember personal connections."
},
{
"category": "setting",
"description": "A sprawling city built vertically on massive redwood trees, with neighborhoods at different heights determining social status. The highest platforms catch the sun while the lowest levels rarely see direct light."
},
{
"category": "setting",
"description": "An underground library that extends for miles beneath a desert. The books are sorted not by author or subject but by the emotional response they evoke in readers."
},
{
"category": "setting",
"description": "A floating marketplace where boats of all sizes gather once a month during the full moon. Many vendors sell magical items of questionable origin and refuse to accept regular currency."
},
{
"category": "plot_twist",
"description": "The hero's loyal companion animal was actually the main villain all along, telepathically manipulating events and gathering intelligence."
},
{
"category": "plot_twist",
"description": "The seemingly advanced technology everyone depends on is actually powered by an ancient sleeping entity beneath the city, and it's beginning to wake up."
},
{
"category": "significant_prop",
"description": "A compass that doesn't point north but instead points toward whatever the holder desires most, though they don't always understand what it's showing them."
},
{
"category": "significant_prop",
"description": "A pair of headphones that let the wearer hear conversations that happened in that location in the past, but only during rainfall."
},
{
"category": "character_backstory",
"description": "Before becoming the town doctor, they were experimented on in a government facility, which left them with healing abilities but also makes them experience their patients' pain."
},
{
"category": "character_backstory",
"description": "The cheerful mailman once accidentally delivered a letter that caused a war between kingdoms. He's spent decades secretly trying to atone for his mistake by ensuring people receive messages that bring joy."
},
{
"category": "atmospheric_conditions",
"description": "A perpetual sunset that has lasted for three years, casting the world in amber light and causing flowers to bloom continuously."
},
{
"category": "atmospheric_conditions",
"description": "A dense morning fog that carries whispers of conversations happening miles away, forcing people to share secrets only at high noon when the air is clear."
},
{
"category": "symbolic_motif",
"description": "Clockwork birds appear whenever someone is about to make a life-changing decision. The number of birds indicates the magnitude of the potential change."
},
{
"category": "symbolic_motif",
"description": "Water flows uphill before disaster strikes, but only the children in the community ever seem to notice this phenomenon."
},
{
"category": "special_ability",
"description": "The power to temporarily transfer knowledge by touch. The recipient gains the knowledge but the giver forgets it for exactly 24 hours."
},
{
"category": "special_ability",
"description": "The ability to see one minute into the future, but only through reflective surfaces like mirrors or still water."
},
{
"category": "cultural_element",
"description": "A coming-of-age ceremony where teenagers must craft a mask representing their fears, then wear it for a month. At the end, the community helps them break it apart and plant flowers in the pieces."
},
{
"category": "cultural_element",
"description": "A society where people don't use names but instead are identified by a unique gesture and specific musical notes. These identifiers evolve throughout their lives to reflect significant experiences."
},
{
"category": "technology_concept",
"description": "Mood-sensitive ink that changes color based on the emotional state of whoever is reading it, making literature a different experience for each person."
},
{
"category": "technology_concept",
"description": "Portable doorways that can be placed on any flat surface to create passages to places previously visited by the user. Each doorway can only be used a limited number of times."
},
{
"category": "conflict",
"description": "A rapidly spreading disease that doesn't kill people but erases their memories of loved ones, causing society to fracture as relationships are forgotten."
},
{
"category": "conflict",
"description": "Two neighboring towns must decide whether to destroy a dam that's threatening to break. One town would be flooded if it fails naturally, the other would lose its main water source if it's demolished."
},
{
"category": "theme",
"description": "The price of immortality - what memories become burdens when you live forever, and what joys fade with familiarity?"
},
{
"category": "theme",
"description": "The strength found in vulnerability - how sharing our weaknesses connects us more deeply than displaying our strengths."
},
{
"category": "character_relationship",
"description": "Twin sisters who share dreams and feel each other's physical pain, but have opposing moral views and find themselves on different sides of a brewing conflict."
},
{
"category": "character_relationship",
"description": "A master craftsman and apprentice who communicate almost exclusively through their work, gradually modifying a single creation to express their evolving relationship."
},
{
"category": "resolution_approach",
"description": "The conflict is resolved when opponents are forced to live each other's memories for a day, causing both sides to develop unexpected empathy."
}
]
}

## EXAMPLE OUTPUT FORMAT (SCENE + VISUAL DESCRIPTIONS)

See screenshot
