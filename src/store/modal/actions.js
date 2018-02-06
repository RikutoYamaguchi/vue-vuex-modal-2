import _ from 'lodash';

import {
  PUSH,
  CLOSE,
  ADD_INDEX,
  CHANGE_INDEX,
  APPLY_TRANSITION,
  INIT_DEFERRED,
  SAVE_CALLBACK
} from "./types";

const TRANSITION_NAMES = {
  default: 'scale',
  forward: 'forward',
  backward: 'backward'
};

let promiseStore = null;

export default {
  push({ commit, getters }, { name, params, callback = null, dfd }) {
    // save before modalNames length
    const { modalLength, deferred } = getters;

    // decide transition name
    if (modalLength > 0) {
      commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.forward });
    } else {
      commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.default });
    }

    // push modal
    commit(PUSH, { name, params });
    _.delay(() => commit(CHANGE_INDEX, modalLength), 1);

    // save callback
    if (callback !== null) {
      commit(SAVE_CALLBACK, callback);
    }

    if (deferred === null) {
      // create deferred
      let _resolve = null;
      let _reject = null;
      promiseStore = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
      commit(INIT_DEFERRED, {
        resolve: _resolve,
        reject: _reject
      });
    }

    if (dfd) {
      return promiseStore;
    }
  },

  close({ commit }) {
    commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.default });
    promiseStore = null;
    _.delay(() => commit(CLOSE), 1);
  },

  reject({ dispatch, getters }, err = null) {
    const { callback, deferred } = getters;
    if (_.isFunction(callback)) {
      callback({ message: 'rejected' }, err);
    }
    if (deferred !== null) {
      deferred.reject(err);
    }
    dispatch('close');
  },

  resolve({ dispatch, getters }, data) {
    const { callback, deferred } = getters;
    if (_.isFunction(callback)) {
      callback(null ,data);
    }
    if (deferred !== null) {
      deferred.resolve(data);
    }
    dispatch('close');
  },

  go({ commit, getters }, n) {
    const { modalLength, currentIndex } = getters;
    const nextIndex = currentIndex + n;

    if (nextIndex < 0 || modalLength - 1 < nextIndex) {
      console.warn('There is no target modal. ');
      return false;
    }

    if (n > 0) {
      commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.forward });
    } else {
      commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.backward });
    }
    _.delay(() => commit(ADD_INDEX, n), 1);
  },

  forward({ commit, getters }) {

    const { modalLength, currentIndex } = getters;
    const nextIndex = currentIndex + 1;

    if (nextIndex > modalLength - 1) {
      console.warn('There is no target modal. ');
      return false;
    }

    commit(APPLY_TRANSITION, { transitionName: TRANSITION_NAMES.forward });
    _.delay(() => commit(CHANGE_INDEX, nextIndex), 1);
  },

  back({ commit, getters }) {
    const { currentIndex } = getters;
    const nextIndex = currentIndex - 1;

    if (nextIndex < 0) {
      console.warn('There is no target modal. ');
      return false;
    }

    commit(APPLY_TRANSITION, { transitionName: 'backward' });
    _.delay(() => commit(CHANGE_INDEX, nextIndex), 1);
  }
};