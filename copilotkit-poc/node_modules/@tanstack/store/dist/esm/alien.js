var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2[ReactiveFlags2["None"] = 0] = "None";
  ReactiveFlags2[ReactiveFlags2["Mutable"] = 1] = "Mutable";
  ReactiveFlags2[ReactiveFlags2["Watching"] = 2] = "Watching";
  ReactiveFlags2[ReactiveFlags2["RecursedCheck"] = 4] = "RecursedCheck";
  ReactiveFlags2[ReactiveFlags2["Recursed"] = 8] = "Recursed";
  ReactiveFlags2[ReactiveFlags2["Dirty"] = 16] = "Dirty";
  ReactiveFlags2[ReactiveFlags2["Pending"] = 32] = "Pending";
  return ReactiveFlags2;
})(ReactiveFlags || {});
// @__NO_SIDE_EFFECTS__
function createReactiveSystem({
  update,
  notify,
  unwatched
}) {
  return {
    link,
    unlink,
    propagate,
    checkDirty,
    shallowPropagate
  };
  function link(dep, sub, version) {
    const prevDep = sub.depsTail;
    if (prevDep !== void 0 && prevDep.dep === dep) {
      return;
    }
    const nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
    if (nextDep !== void 0 && nextDep.dep === dep) {
      nextDep.version = version;
      sub.depsTail = nextDep;
      return;
    }
    const prevSub = dep.subsTail;
    if (prevSub !== void 0 && prevSub.version === version && prevSub.sub === sub) {
      return;
    }
    const newLink = sub.depsTail = dep.subsTail = {
      version,
      dep,
      sub,
      prevDep,
      nextDep,
      prevSub,
      nextSub: void 0
    };
    if (nextDep !== void 0) {
      nextDep.prevDep = newLink;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = newLink;
    } else {
      sub.deps = newLink;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = newLink;
    } else {
      dep.subs = newLink;
    }
  }
  function unlink(link2, sub = link2.sub) {
    const dep = link2.dep;
    const prevDep = link2.prevDep;
    const nextDep = link2.nextDep;
    const nextSub = link2.nextSub;
    const prevSub = link2.prevSub;
    if (nextDep !== void 0) {
      nextDep.prevDep = prevDep;
    } else {
      sub.depsTail = prevDep;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = nextDep;
    } else {
      sub.deps = nextDep;
    }
    if (nextSub !== void 0) {
      nextSub.prevSub = prevSub;
    } else {
      dep.subsTail = prevSub;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = nextSub;
    } else if ((dep.subs = nextSub) === void 0) {
      unwatched(dep);
    }
    return nextDep;
  }
  function propagate(link2) {
    let next = link2.nextSub;
    let stack;
    top: do {
      const sub = link2.sub;
      let flags = sub.flags;
      if (!(flags & (4 | 8 | 16 | 32))) {
        sub.flags = flags | 32;
      } else if (!(flags & (4 | 8))) {
        flags = 0;
      } else if (!(flags & 4)) {
        sub.flags = flags & -9 | 32;
      } else if (!(flags & (16 | 32)) && isValidLink(link2, sub)) {
        sub.flags = flags | (8 | 32);
        flags &= 1;
      } else {
        flags = 0;
      }
      if (flags & 2) {
        notify(sub);
      }
      if (flags & 1) {
        const subSubs = sub.subs;
        if (subSubs !== void 0) {
          const nextSub = (link2 = subSubs).nextSub;
          if (nextSub !== void 0) {
            stack = { value: next, prev: stack };
            next = nextSub;
          }
          continue;
        }
      }
      if ((link2 = next) !== void 0) {
        next = link2.nextSub;
        continue;
      }
      while (stack !== void 0) {
        link2 = stack.value;
        stack = stack.prev;
        if (link2 !== void 0) {
          next = link2.nextSub;
          continue top;
        }
      }
      break;
    } while (true);
  }
  function checkDirty(link2, sub) {
    let stack;
    let checkDepth = 0;
    let dirty = false;
    top: do {
      const dep = link2.dep;
      const flags = dep.flags;
      if (sub.flags & 16) {
        dirty = true;
      } else if ((flags & (1 | 16)) === (1 | 16)) {
        if (update(dep)) {
          const subs = dep.subs;
          if (subs.nextSub !== void 0) {
            shallowPropagate(subs);
          }
          dirty = true;
        }
      } else if ((flags & (1 | 32)) === (1 | 32)) {
        if (link2.nextSub !== void 0 || link2.prevSub !== void 0) {
          stack = { value: link2, prev: stack };
        }
        link2 = dep.deps;
        sub = dep;
        ++checkDepth;
        continue;
      }
      if (!dirty) {
        const nextDep = link2.nextDep;
        if (nextDep !== void 0) {
          link2 = nextDep;
          continue;
        }
      }
      while (checkDepth--) {
        const firstSub = sub.subs;
        const hasMultipleSubs = firstSub.nextSub !== void 0;
        if (hasMultipleSubs) {
          link2 = stack.value;
          stack = stack.prev;
        } else {
          link2 = firstSub;
        }
        if (dirty) {
          if (update(sub)) {
            if (hasMultipleSubs) {
              shallowPropagate(firstSub);
            }
            sub = link2.sub;
            continue;
          }
          dirty = false;
        } else {
          sub.flags &= -33;
        }
        sub = link2.sub;
        const nextDep = link2.nextDep;
        if (nextDep !== void 0) {
          link2 = nextDep;
          continue top;
        }
      }
      return dirty;
    } while (true);
  }
  function shallowPropagate(link2) {
    do {
      const sub = link2.sub;
      const flags = sub.flags;
      if ((flags & (32 | 16)) === 32) {
        sub.flags = flags | 16;
        if ((flags & (2 | 4)) === 2) {
          notify(sub);
        }
      }
    } while ((link2 = link2.nextSub) !== void 0);
  }
  function isValidLink(checkLink, sub) {
    let link2 = sub.depsTail;
    while (link2 !== void 0) {
      if (link2 === checkLink) {
        return true;
      }
      link2 = link2.prevDep;
    }
    return false;
  }
}
export {
  ReactiveFlags,
  createReactiveSystem
};
//# sourceMappingURL=alien.js.map
