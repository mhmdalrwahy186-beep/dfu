# Brief: Family House 15 x 30

## Source

Client brief received in conversation on 2026-11-13. Original wording kept below; interpretation
in the matrix.

> Design a 2-storey, 3-bedroom family house. Plot: 15 m wide x 30 m deep, street on the south side,
> north is up/towards the back. Setbacks: 3 m front, 1.5 m sides, 5 m rear. Max built area: 120 m²
> per floor. Rooms: open kitchen + dining + living, 3 bedrooms (master with en-suite), 2 bathrooms,
> guest WC, laundry, single garage. Style: modern, flat roof, large windows to the garden.
> Must-haves: living room faces the garden, stairs near the entrance.

## Requirement matrix

| # | Requirement | Type | Value or limit | Source | Status |
|---|---|---|---|---|---|
| R1 | Storeys | program | 2 | brief | met |
| R2 | Built area per floor | limit | at most 120 m² | brief | met: 119.7 / 119.7 m² |
| R3 | Front setback (south, street) | limit | 3.0 m | brief | met: 5.5 m |
| R4 | Side setbacks (east, west) | limit | 1.5 m | brief | met: 1.5 m both |
| R5 | Rear setback (north) | limit | 5.0 m | brief | met: 12.5 m |
| R6 | Open kitchen + dining + living | program | one space | brief | met: 60.4 m² |
| R7 | Bedrooms | program | 3, main with en-suite | brief | met: 22.0 / 17.0 / 17.0 m² |
| R8 | Bathrooms | program | 2 | brief | met: en-suite + family bathroom |
| R9 | Guest WC | program | 1 | brief | met: ground floor, by the entrance |
| R10 | Laundry | program | 1 | brief | met: 3.7 m² |
| R11 | Single garage | program | 1 car | brief | met: 3.3 x 6.0 m internal |
| R12 | Style | preference | modern, flat roof | brief | met: flat roof, 0.5 m parapet, rendered |
| R13 | Large windows to the garden | preference | north facade | brief | met: 3.2 m and 2.8 m sliders |
| R14 | Living room faces the garden | preference | north | brief | met |
| R15 | Stairs near the entrance | preference | adjacency | brief | met: first step 0.2 m from the front door |

## Site facts

- Boundary and dimensions: rectangle 15.0 m (street frontage) x 30.0 m deep.
- Street side and access: south.
- Orientation: plan north is the back of the plot (north arrow up). True north assumed equal to plan north.
- Levels and slope: not given; treated as flat at ±0.00 (placeholder).
- Setbacks: 3.0 m front, 1.5 m sides, 5.0 m rear. Buildable zone x 1.5-13.5 m, y 3.0-25.0 m.
- Services, trees, easements: not given.

## Decision questions

Adopted as assumptions so the drawings could be produced straight away. Change any of them and
the model will be revised.

### Q1. Where does the garage go?

- **A.** Integral, projecting towards the street, two storeys (study above).
- **B.** Integral, inside the main rectangle.
- **C.** Detached or carport.
- **Recommendation:** A, because it keeps the whole garden side for living space and leaves a 5.5 m driveway for a second car.
- **Answer:** assumed A.

### Q2. Stair type?

- **A.** Straight flight along the front wall of the hall.
- **B.** U-shaped stair.
- **C.** Feature stair in the living space.
- **Recommendation:** A, because it starts beside the front door and leaves the whole garden side open.
- **Answer:** assumed A.

### Q3. How to use the rest of the 120 m² upstairs?

- **A.** Full upper floor with a study, walk-in wardrobe and larger bathrooms.
- **B.** Smaller upper floor with roof terraces.
- **C.** Smaller upper floor, single-storey parts with plain flat roofs.
- **Recommendation:** A, because it gives the most usable space within the limit and a clean cubic form.
- **Answer:** assumed A.

## Assumptions

- Floor to floor 3.0 m on the ground floor; 2.9 m floor to roof slab on the first floor.
- True north equals plan north; the site is flat; no local code was named, so the engine's default rules apply.
- Garage door: a sectional door, drawn as a single leaf.
- External finish: white render with dark window frames.
