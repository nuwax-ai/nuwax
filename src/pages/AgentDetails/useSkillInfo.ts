import { useEffect, useState } from 'react';
import { useLocation } from 'umi';

/**
 * 技能信息
 * @returns {Object} 技能信息
 * @returns {Object.skillInfo} 技能信息
 */
const useSkillInfo = () => {
  const location = useLocation();
  // 技能信息
  const [skillInfo, setSkillInfo] = useState<{
    // 技能ID
    targetId: number;
    name: string;
  } | null>(null);

  // 从location.search中获取技能信息
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const skillId = searchParams.get('skillId');
    const skillName = searchParams.get('skillName');

    if (skillId && skillName) {
      setSkillInfo({
        targetId: Number(skillId),
        name: decodeURIComponent(skillName || ''),
      });
    }
  }, [location.search]);

  return {
    skillInfo,
  };
};

export default useSkillInfo;
