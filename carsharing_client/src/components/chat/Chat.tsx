import React, { useState, useEffect, useRef } from "react";
import "../chat/ChatPanel.css";
import { ChatMessage, Message, Room, Token, User } from "../../Interfaces";
import {
  createMessage,
  getMessages,
  getOrCreateRoomByUsers,
} from "../../api/ChatService";
import { useParams } from "react-router-dom";
import { getUsersByToken } from "../../api/UserService";
import { authAPI } from "../../api/AuthenticationService";
import { useAuthStore } from "../../store/auth";
import * as jwt_decode from "jwt-decode";
import Navbar from "../home/Navbar";
import toast from "react-hot-toast";

const Chat = ({ room }) => {
  const chatContainerClass = room ? true : false;
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User>();
  const [otherUser, setOtherUser] = useState<User>();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  let { roomName } = useParams();

  const socketRef = useRef<WebSocket>();
  const roomIdRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const token: string = useAuthStore.getState().access;
  const tokenDecoded: Token = jwt_decode.jwtDecode(token);

  const id = tokenDecoded.user_id;

  const get_solo_user = async (id: number) => {
    const response = await authAPI.get(`/user/get/solo/${id}/`);
    return response.data;
  };

  useEffect(() => {
    const getUserFromToken = async () => {
      const userr = await get_solo_user(id);
      setUser(userr);

      if (room) {
        const otherUser = room.users.find((u) => u.id !== userr.id);
        setOtherUser(otherUser);
        connectToWebSocket(userr, otherUser?.id);
      } else {
        if (roomName?.endsWith("_room"))
          roomName = roomName.replace("_room", "");
        const token = await getUsersByToken(roomName || "");

        if (token) {
          const otherUser =
            token.user1_id !== userr.id ? token.user1_id : token.user2_id;
          setOtherUser(otherUser);
          if (otherUser) {
            connectToWebSocket(userr, otherUser);
          } else {
            toast.error("No se encontró el otro usuario en la sala");
            console.error("No se encontró el otro usuario en la sala");
          }
        } else {
          toast.error("La sala no existe o no tiene exactamente 2 usuarios");
          console.error("La sala no existe o no tiene exactamente 2 usuarios");
        }
      }
    };

    const connectToWebSocket = async (user, otherUser) => {
      try {
        const existingRoomData = await getOrCreateRoomByUsers(
          user.id,
          otherUser
        );
        let roomId;
        if (existingRoomData) {
          roomId = existingRoomData.room_id;
        }
        roomIdRef.current = roomId;

        const wsUrl = `ws://127.0.0.1:8000/ws/room/${existingRoomData.websocket_token}/`;

        if (
          !socketRef.current ||
          socketRef.current.readyState !== WebSocket.OPEN ||
          socketRef.current.url !== wsUrl
        ) {
          if (socketRef.current) {
            socketRef.current.onmessage = null;
            socketRef.current.close();
          }
          socketRef.current = new WebSocket(wsUrl);

          socketRef.current.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);
            setChatHistory((prevHistory) => [...prevHistory, newMessage]);
          };

          getMessages(roomId)
            .then((response) => {
              if (response && response.length > 0) {
                setChatHistory(
                  response.map((message) => ({
                    id: message.id,
                    text: message.text,
                    sender: message.sender,
                    timestamp: message.timestamp,
                  }))
                );
              }
            })
            .catch((error) => {
              toast.error("Error al recuperar los mensajes");
              console.error("Error fetching messages:", error);
            });
        }
      } catch (error) {
        toast.error("Error en la conexión");
        console.error("Error connecting to WebSocket:", error);
      }
    };

    getUserFromToken();

    return () => {
      if (socketRef.current) {
        socketRef.current.onmessage = null;
        socketRef.current.close();
      }
    };
  }, [room]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const roomId = roomIdRef.current ?? 0;

      if (!user) {
        toast.error("No se ha encontrado el usuario");
        console.error("No se ha encontrado el usuario.");
        return;
      }

      const messageData: Message = {
        text: message,
        sender: user,
        room_id: roomId,
      };

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            text: message,
            sender: user?.username,
            room_id: roomId,
          })
        );
      }

      setMessage("");

      createMessage(messageData)
        .then((response) => {
          console.log("Message created successfully:", response.data);
        })
        .catch((error) => {
          toast.error("Error al crear el mensaje");
          console.error("Error creating message:", error);
        });
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (date.toString() === "Invalid Date") {
      return new Date().toLocaleString();
    } else {
      return date.toLocaleString("es-ES");
    }
  };

  return (
    <div>
      {!room ? <Navbar /> : null}
      <div
        className={`chat-panel chat-panel-${chatContainerClass}`}
        id="chat-panel"
      >
        <div className="conversation">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`message-container ${
                msg.sender === user?.username
                  ? `sent-message ${
                      room
                        ? "sent-message-room-true"
                        : "sent-message-room-false"
                    }`
                  : `received-message ${
                      room
                        ? "received-message-room-true"
                        : "received-message-room-false"
                    }`
              }`}
            >
              <div className="message-sender">
                <strong>{msg.sender}</strong>
              </div>
              <div
                className={`message ${
                  msg.sender === user?.username ? "sent" : "received"
                }`}
              >
                {msg.text}
              </div>
              <div className="message-timestamp">
                {formatDate(msg.timestamp)}
              </div>
            </div>
          ))}

          <div ref={chatEndRef}></div>
        </div>
        <div className="message-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribir mensaje..."
            className={`room-${chatContainerClass}`}
          />
          <button
            className={`room-${chatContainerClass}`}
            onClick={sendMessage}
          >
            <i className="fas fa-paper-plane"></i>{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
