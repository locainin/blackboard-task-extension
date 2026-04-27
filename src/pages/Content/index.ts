import { BlackboardEntrypoint } from './modules/plugins/blackboard';
import {
  installExtensionContextInvalidatedHandler,
  swallowExtensionContextInvalidated,
} from './modules/utils/extensionContext';
import { waitForBlackboardPage } from './bootstrap';

/*

Performance overhead on websites that aren't Blackboard:

document.getElementById() is called once

*/
installExtensionContextInvalidatedHandler();

waitForBlackboardPage({
  onStart: () => {
    // Keep the user-facing startup log at the real entrypoint boundary
    console.log('Tasks for Blackboard: Blackboard detected');
    void BlackboardEntrypoint().catch(swallowExtensionContextInvalidated);
  },
});
