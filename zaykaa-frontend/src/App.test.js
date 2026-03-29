import { previewRecipes } from './data/mockData';

test('recipe book preview data includes detailed recipes', () => {
  expect(previewRecipes.length).toBeGreaterThan(0);
  expect(previewRecipes[0].title).toBeTruthy();
  expect(previewRecipes[0].originState).toBeTruthy();
  expect(previewRecipes[0].authenticityTag).toBeTruthy();
  expect(previewRecipes[0].ingredients.length).toBeGreaterThan(0);
  expect(previewRecipes[0].steps.length).toBeGreaterThan(0);
});
