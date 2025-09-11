import React from "react";
import { Image, View, StyleProp, ViewStyle, ImageStyle } from "react-native";

import { SvgProps } from "react-native-svg";

export type FlagIconProps = {
  icon: React.FC<SvgProps> | number;
  style?: StyleProp<ViewStyle> | StyleProp<ImageStyle>;
  width?: number;
  height?: number;
};

export default function FlagIcon({
  icon,
  style,
  width = 24,
  height = 24,
}: FlagIconProps) {
  if (typeof icon === "number") {
    return (
      <Image
        source={icon}
        style={[{ width, height }, style as StyleProp<ImageStyle>]}
        resizeMode="contain"
      />
    );
  }
  const SvgFlag = icon as React.FC<SvgProps>;
  return (
    <View style={style as StyleProp<ViewStyle>}>
      <SvgFlag width={width} height={height} />
    </View>
  );
}
