import type { StackNavigationProp } from "@react-navigation/stack";

import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../App";

export function useAppNavigation() {
  return useNavigation<StackNavigationProp<RootStackParamList>>();
}
