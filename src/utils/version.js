import { VERSION_INFO } from '../VERSION';

export const getVersionInfo = () => {
  if (VERSION_INFO.tag) {
    return VERSION_INFO.tag;
  } else if (VERSION_INFO.commit) {
    let branchCommit = '';
    branchCommit = VERSION_INFO.branch ? VERSION_INFO.branch : '';
    branchCommit += VERSION_INFO.commit ? ` [${VERSION_INFO.commit.substring(0, 8)}]` : '';
    return branchCommit;
  } else {
    return 'Local build';
  }
};
