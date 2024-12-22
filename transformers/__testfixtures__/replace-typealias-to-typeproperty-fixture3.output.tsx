// @ts-nocheck
import { isBlank } from "@mansion-note/utils/string";
import classNames from "classnames";
import Icon from "@/features/common/ui/Icon";
import { HasChildren } from "@/utils/react/types";

type Props = {
  /** 棟名 */
  name: string | undefined;
  /** 棟名が長い場合に省略せず表示 */
  noTruncate?: boolean;
} & HasChildren;

function MansionBuildingName({ className, name, noTruncate }: Props) {
  if (isBlank(name)) {
    return null;
  }
  return (
    <div
      className={classNames(
        "name-building",
        { "name-building__no-truncate": noTruncate },
        className
      )}
    >
      <Icon icon="icon-outline-mansion" className="name-building__tag">
        棟名
      </Icon>
      <span className="name-building__txt">{name}</span>
    </div>
  );
}

export default MansionBuildingName;
