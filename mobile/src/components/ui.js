import { useMemo } from "react";
import { Pressable, Text, ActivityIndicator, View, StyleSheet, TextInput, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../theme";

export function useStyles(factory) {
  const c = useColors();
  return [useMemo(() => StyleSheet.create(factory(c)), [c]), c]; // eslint-disable-line react-hooks/exhaustive-deps
}

export function Button({ title, onPress, variant = "primary", loading, disabled, style, icon }) {
  const c = useColors();
  const bg = variant === "primary" ? c.primary : variant === "danger" ? c.danger : "transparent";
  const fg = variant === "primary" ? c.onPrimary : variant === "danger" ? "#fff" : c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) =>
        StyleSheet.flatten([
          {
            backgroundColor: bg,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          },
          variant === "outline" && { borderWidth: 1, borderColor: c.border },
          (pressed || disabled) && { opacity: 0.6 },
          style,
        ])
      }
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={{ color: fg, fontWeight: "700", fontSize: 16 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}

export function Empty({ icon, children, action }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12, backgroundColor: c.bg }}>
      {icon && <Ionicons name={icon} size={56} color={c.muted} />}
      <Text style={{ color: c.muted, textAlign: "center", fontSize: 15 }}>{children}</Text>
      {action}
    </View>
  );
}

export function Input({ label, hint, style, ...props }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ color: c.muted, fontSize: 13 }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={StyleSheet.flatten([
          {
            backgroundColor: c.input,
            color: c.text,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            fontSize: 16,
            borderWidth: 1,
            borderColor: c.border,
          },
          props.editable === false && { opacity: 0.6 },
          style,
        ])}
      />
      {hint ? <Text style={{ color: c.muted, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }) {
  const c = useColors();
  return (
    <View style={StyleSheet.flatten([{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border }, style])}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }) {
  const c = useColors();
  return (
    <Text style={{ color: c.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginTop: 20, marginBottom: 8, marginLeft: 4 }}>
      {children}
    </Text>
  );
}

/** Row inside a grouped list (menu, settings) */
export function Row({ icon, label, onPress, right, danger, subtitle, last }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: c.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={22} color={danger ? c.danger : c.primary} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? c.danger : c.text, fontSize: 16 }}>{label}</Text>
        {subtitle ? <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && !right ? <Ionicons name="chevron-forward" size={18} color={c.muted} /> : null}
    </Pressable>
  );
}

export function Group({ children }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
      {children}
    </View>
  );
}

export function Badge({ children, color }) {
  const c = useColors();
  return (
    <Text style={{ color: "#fff", backgroundColor: color || c.pink, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1, overflow: "hidden", fontWeight: "700", fontSize: 13 }}>
      {children}
    </Text>
  );
}

export function Toggle({ value, onValueChange }) {
  const c = useColors();
  return <Switch value={value} onValueChange={onValueChange} trackColor={{ true: c.primary }} />;
}

/** Radio-like choice row */
export function Choice({ label, selected, onPress, last }) {
  const c = useColors();
  return (
    <Row
      label={label}
      onPress={onPress}
      last={last}
      right={<Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? c.primary : c.muted} />}
    />
  );
}
