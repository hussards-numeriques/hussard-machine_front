# Sound — Game sound effects

Short synthesized sound effects (no music) tied to stimulating actions. Everything is generated at runtime with the Web Audio API: no audio file, no dependency, nothing for crawlers to see, so there is no SEO or bundle-size impact. Works in browsers and in the Capacitor WebView.

## Structure

| File                                         | Role                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/sounds.ts`                          | `SoundId` union, `SOUND_NOTES: Record<SoundId, SoundNote[]>` (the "score" of each sound), `midiToFrequency`                                                  |
| `src/services/sound/port.ts`                 | `SoundPlayer` contract (`play`, `unlock`)                                                                                                                    |
| `src/services/sound/WebAudioSoundPlayer.ts`  | Adapter: one oscillator + envelope per note, shared compressor and master gain, lazy `AudioContext`                                                          |
| `src/services/sound/unlockOnFirstGesture.ts` | Resumes the `AudioContext` on pointerup/click/touchend/keydown and keeps listening until it is really `running` (autoplay policy, iOS); called in `main.tsx` |
| `src/hooks/useSoundEnabled.ts`               | On/off preference in `localStorage` (`calc-rush:sound-enabled`, default on), device-only                                                                     |
| `src/hooks/useAnswerSound.ts`                | Plays `correct`/`wrong` once per question id (survives `AnswerFeedbackPop` remounts)                                                                         |
| `src/hooks/useSound.ts`                      | Returns `play(id)`, a no-op when sounds are disabled. Components call this, never the player directly                                                        |

## Where sounds play

| Sound       | Trigger                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `correct`   | `useAnswerSound` in `GameView`, once per answered question (correct)                                      |
| `wrong`     | `useAnswerSound` in `GameView`, once per answered question (wrong)                                        |
| `tick`      | `QuestionCard`, each of the last 3 seconds while not answered                                             |
| `countdown` | `LaunchCountdownOverlay`, 5→1                                                                             |
| `go`        | `LaunchCountdownOverlay`, 0                                                                               |
| `tap`       | `KeypadInput` digit / backspace                                                                           |
| `xp`        | `EndGameXpProgress` bar animation: 3 to 16 rising blops (`xpBlopCount`), scaled by XP gained vs one grade |
| `levelUp`   | `EndGameXpProgress` when a grade was just crossed (instead of `xp`)                                       |
| `unlock`    | `TitleUnlockToast` appears                                                                                |
| `victory`   | `PodiumView` when the current player is in the top 3                                                      |
| `finish`    | `PodiumView` otherwise                                                                                    |

## Adding or tuning a sound

1. Add the id to `SoundId`, then its notes in `SOUND_NOTES` (`tsc` flags a missing entry).
2. Call `useSound()` where the action happens and `play('id')` in an event handler or an effect.
3. `src/lib/sounds.spec.ts` checks every sound is well-formed and under 2 s.

The settings toggle lives in `SettingsPage` (`SoundCard`), available to guests too.
