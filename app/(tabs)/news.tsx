import { ScreenContainer } from '@/components';
import { NewsWorkspace } from '@/features/news';
export default function NewsScreen() {
  return (
    <ScreenContainer eyebrow="SPRINT 1.9 • PROVIDER-NEUTRAL" title="News & Catalysts">
      <NewsWorkspace />
    </ScreenContainer>
  );
}
