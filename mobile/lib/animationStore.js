import { router } from 'expo-router';

let _animation = 'slide_from_right';

export function setPendingAnimation(a) {
  _animation = a;
}

export function getPendingAnimation() {
  return _animation;
}

export function navForward(route, params) {
  _animation = 'slide_from_right';
  if (params) router.push({ pathname: route, params });
  else router.push(route);
}

// Always push with slide_from_left — guarantees simultaneous exit+enter animation
export function navBack(route) {
  _animation = 'slide_from_left';
  router.push(route ?? '/(app)/dashboard');
}
