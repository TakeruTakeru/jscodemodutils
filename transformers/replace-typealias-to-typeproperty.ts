import type { API, FileInfo } from "jscodeshift";

// usage
// import { HasClassName } from "@/types";
// type Props = {
//  hoge: string
// } & HasClassName;
// ↓
// type Props = {
//  hoge: string
//  className?: string
// }

// ref:https://astexplorer.net/
// parser:@babel/parser
// transformer: recast

// only available with directImport
// e.g.
// 👍 import { HasClassName } from "@/types";
// 👎 import HasClassName from "@/types";
export default function transformer(fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // [Config Section]
  // replaceWithTypeAliasSelector: The selector to find the type alias to be replaced.
  // removeTypeAliasName: The type name to be replaced.
  // propertyKey: The property key to be added.
  // addProperty: The property to be added instead.
  // isOptional: Whether the property is optional or not.
  const replaceWithTypeAliasSelector = { id: { name: "Props" } };
  const removeTypeAliasName = "HasClassName";
  const propertyKey = "className";
  const addProperty = j.tsPropertySignature(
    j.identifier(propertyKey),
    j.tsTypeAnnotation(j.tsStringKeyword())
  );
  const isOptional = true;

  let isDirty = false;

  // Remove `removeTypeAliasName` import
  root.find(j.ImportDeclaration).forEach((path: any) => {
    const specifiers = path.node.specifiers.filter(
      (specifier: any) =>
        !(
          specifier.type === "ImportSpecifier" &&
          specifier.imported.name === removeTypeAliasName
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

  // Remove `removeTypeAliasName` from type definitions
  root.find(j.TSIntersectionType).forEach((path: any) => {
    const types = path.node.types;
    const filteredTypes = types.filter(
      (type: any) =>
        !(
          type.type === "TSTypeReference" &&
          type.typeName.name === removeTypeAliasName
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

  // Add `addProperty` to the Props type
  root
    .find(j.TSTypeAliasDeclaration, replaceWithTypeAliasSelector)
    .forEach((path: any) => {
      const typeLiteral = path.node.typeAnnotation;

      if (typeLiteral.type === "TSTypeLiteral") {
        const isDuplicated = typeLiteral.members.some(
          (member: any) =>
            member.type === "TSPropertySignature" &&
            member.key.type === "Identifier" &&
            member.key.name === propertyKey
        );

        if (!isDuplicated) {
          typeLiteral.members.push(addProperty);
          // Mark as optional
          if (isOptional) {
            typeLiteral.members[typeLiteral.members.length - 1].optional = true;
          }
        }
      }
    });

  return root.toSource();
}
