import { GameConfig } from '../GameConfig';

describe('GameConfig', () => {
  test('should have correct default values', () => {
    expect(GameConfig.GAME_WIDTH).toBe(1920);
    expect(GameConfig.GAME_HEIGHT).toBe(1080);
    expect(GameConfig.DEFAULT_TEMPO).toBe(1.0);
    expect(GameConfig.PLAYER_SPEED).toBe(400);
  });

  test('should have valid color values', () => {
    expect(GameConfig.COLORS.PRIMARY).toBe('#6B46C1');
    expect(GameConfig.COLORS.SUCCESS).toBe('#10B981');
    expect(GameConfig.COLORS.ERROR).toBe('#EF4444');
  });

  test('should have reasonable timing windows', () => {
    expect(GameConfig.PERFECT_TIMING_WINDOW).toBeLessThan(GameConfig.GOOD_TIMING_WINDOW);
    expect(GameConfig.GOOD_TIMING_WINDOW).toBeGreaterThan(0);
  });
});