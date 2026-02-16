# Finest 9
Card and dice combination game made up on the fly by a six year old.

Requires a standard deck of cards without Jokers and two six sided dice.

## Setup

1. Each player rolls the two dice and whomever has the highest score of the dice added together goes first
1. Shuffle the deck of cards
1. Distribute 9 cards to each of the players, they are placed face up in front of the player

## Game Loop

1. Roll the dice and add the two numbers together
1. **If you roll a 9 you must roll again** (keep re-rolling until you get something other than 9)
1. Attempt to match the dice against the cards that are in front of you
1. When matched, **all matching cards** go into your "captured" pile and you score points
1. If you can't make a match then you must draw a card and place it face up in front of you
1. The next player goes and the cycle continues until the deck is out of cards
1. After the last card is played each player gets one more roll and attempt to match

## Matching Rules

### Basic Rules
* Players may only match on their own cards (the face-up cards in front of them)
* **You must have a pair or more to match** - a single card alone can never be matched
* You can only make **one match** per turn
* The dice total must match the **card value**, not the sum of multiple cards

### Card Values
* Number cards (2-10) are worth their face value
* Face cards (Jack, Queen, King) are worth 10
* Aces are worth 11
* 9's are worth 9

### Wild 9's
* All four 9's in the deck (club, diamond, spade, heart) are **wild cards**
* Wild 9's can be used as part of any pair or sequence
* Since rolling a 9 means you must re-roll, 9-cards can only be captured as part of a pair or sequence where another card matches the dice

### Matching with Pairs and Sets
* **The dice value must match the card rank**, not the sum
* When you match, you capture **ALL cards of that rank**

**Examples:**
* You have two 5's and roll a **5** → Capture both 5's (score: 10 points)
* You have two 5's and roll a **10** → No match possible
* You have three 7's and roll a **7** → Capture all three 7's (score: 21 points)
* You have two 9's and one 7, and roll a **7** → Capture all three cards (score: 25 points)

### Matching with Sequences
* A sequence is **three consecutive ranks** (suits don't matter)
* Q-K-A is allowed (wrapping at the top)
* K-A-2 is **not** allowed (cannot wrap around the bottom)
* **One of the three cards must match the dice roll**
* When matched, **all three cards in the sequence** are captured

**Examples:**
* You have 5-6-7 and roll a **6** → Capture all three cards (score: 18 points)
* You have Q-K-A and roll a **10** → Capture all three (Q=10, score: 31 points)
* You have 4-5-6 and roll an **8** → No match (none of the cards equal 8)

## Scoring and Winning

### Point Values
* Number cards: Face value (2-10)
* 9's: 9 points
* Face cards: 10 points each
* Aces: 11 points each

### Final Score Calculation
At the end of the game, each player calculates:

**Final Score = (Points from captured cards) - (Points from cards remaining on table)**

**The player with the highest final score wins!**

### Strategic Note
Drawing cards gives you more matching opportunities, but uncaptured cards hurt your final score. This creates risk/reward tension throughout the game.