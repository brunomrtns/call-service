import React from "react";

import { View, Text } from "react-native";
import Markdown from "react-native-markdown-display";

import { useTheme } from "../../theme/ThemeProvider";

import { useStyles } from "./styles";

interface MessageBubbleProps {
  content: string;
  timestamp: string | number | Date;
  isUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  timestamp,
  isUser,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
      ]}
    >
      <Markdown
        style={{
          body: isUser
            ? { ...styles.messageText, ...styles.messageTextUser }
            : { ...styles.messageText },
          strong: { fontWeight: "bold" },
          em: { fontStyle: "italic" },
          list_item: { flexDirection: "row" },
        }}
      >
        {content}
      </Markdown>

      <Text style={styles.timestamp}>
        {new Date(timestamp).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};

export default MessageBubble;
