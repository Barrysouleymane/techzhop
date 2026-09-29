import { Pressable, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../theme";

export function Button({ title, onPress, variant = "primary", loading, disabled, style }) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary && { backgroundColor: colors.primary },
        isDanger && { backgroundColor: colors.danger },
        !isPrimary && !isDanger && { borderWidth: 1, borderColor: colors.border },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#000" : "#fff"} />
      ) : (
        <Text style={[styles.btnText, isPrimary && { color: "#000" }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function Empty({ children }) {
  return (
    <View style={styles.center}>
      <Text style={{ color: colors.muted, textAlign: "center" }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
});
