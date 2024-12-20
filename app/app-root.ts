import { NavigationService } from './services/navigation.service';

export function onLoaded(args) {
    const frame = args.object;
    NavigationService.getInstance().setMainFrame(frame);
}