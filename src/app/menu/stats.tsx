// Stats: headline numbers and where each one comes from.
import { router } from 'expo-router';
import { useState } from 'react';
import type { StatId } from '../../economy';
import { useLoadedGame } from '../../game/GameProvider';
import { BreakdownCard } from '../../ui/breakdown';
import { StatsHeader } from '../../ui/collider';
import { Screen, SubHeader } from '../../ui/layout';

export default function StatsScreen() {
  const { state } = useLoadedGame();
  const [stat, setStat] = useState<StatId>('power');
  return (
    <Screen>
      <SubHeader title="Stats" parent="/menu" />
      <StatsHeader state={state} onInspect={setStat} />
      <BreakdownCard state={state} stat={stat} onSelect={setStat} onClose={() => router.navigate('/menu')} />
    </Screen>
  );
}
