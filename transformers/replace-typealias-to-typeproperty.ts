import type { API, FileInfo } from "jscodeshift";

// only available with directImport
// e.g.
// 👍 import { HasClassName } from "@/types";
// 👎 import HasClassName from "@/types";
export default function transformer(fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // config section
  // typeAliasName: The type name to be replaced.
  // replaceProperty: The property to be added instead.
  const typeAliasName = "HasClassName";
  const replaceProperty = j.tsPropertySignature(
    j.identifier("className"),
    j.tsTypeAnnotation(j.tsStringKeyword())
  );

  let isDirty = false;

  // Remove `HasClassName` import
  root.find(j.ImportDeclaration).forEach((path: any) => {
    const specifiers = path.node.specifiers.filter(
      (specifier: any) =>
        !(
          specifier.type === "ImportSpecifier" &&
          specifier.imported.name === typeAliasName
        )
    );

    if (specifiers.length !== path.node.specifiers.length) {
      isDirty = true;
      if (specifiers.length === 0) {
        // Remove the entire import if no specifiers remain
        j(path).remove();
      } else {
        // Update the import declaration with remaining specifiers
        path.node.specifiers = specifiers;
      }
    }
  });

  if (!isDirty) {
    return fileInfo.source;
  }

  // Remove `HasClassName` from type definitions
  root.find(j.TSIntersectionType).forEach((path: any) => {
    const types = path.node.types;
    const filteredTypes = types.filter(
      (type: any) =>
        !(
          type.type === "TSTypeReference" &&
          type.typeName.name === typeAliasName
        )
    );

    if (filteredTypes.length !== types.length) {
      if (filteredTypes.length === 1) {
        // Replace the intersection type with the remaining type
        j(path).replaceWith(filteredTypes[0]);
      } else {
        // Update the intersection type with the remaining types
        path.node.types = filteredTypes;
      }
    }
  });

  // Add `className?: string` to the Props type
  root
    .find(j.TSTypeAliasDeclaration, { id: { name: "Props" } })
    .forEach((path: any) => {
      const typeLiteral = path.node.typeAnnotation;

      if (typeLiteral.type === "TSTypeLiteral") {
        const hasClassNameProp = typeLiteral.members.some(
          (member: any) =>
            member.type === "TSPropertySignature" &&
            member.key.type === "Identifier" &&
            member.key.name === "className"
        );

        if (!hasClassNameProp) {
          typeLiteral.members.push(replaceProperty);
          // Mark `className` as optional
          typeLiteral.members[typeLiteral.members.length - 1].optional = true;
        }
      }
    });

  return root.toSource();
}
