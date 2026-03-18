import {
  BlackboardEntrypoint,
  isBlackboard,
} from './modules/plugins/blackboard';
import {
  installExtensionContextInvalidatedHandler,
  swallowExtensionContextInvalidated,
} from './modules/utils/extensionContext';

/* 

Performance overhead on websites that aren't Blackboard:

document.getElementById() is called once

*/
installExtensionContextInvalidatedHandler();

if (isBlackboard) {
  console.log('Tasks for Blackboard: Blackboard detected');
  void BlackboardEntrypoint().catch(swallowExtensionContextInvalidated);
}
