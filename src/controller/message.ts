import { Response, Request } from "express";
import { Message } from "../model/message.model.js";
import { sendMessageToClient } from "../ws.js";
import User from "../model/user.model.js";

interface CustomRequest extends Request {
  user?: any;
}

export async function sendMessage(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const { receiverId, message } = req.body;
  const senderId = req.user._id;
  if (!senderId || !receiverId || !message) {
    res.status(400).json({ success: false, message: "Missing fields" });
    return;
  }
  try {
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });
    await newMessage.populate("senderId", "username avatar");
    const messageSent = sendMessageToClient(receiverId, {
      type: "new_message",
      data: newMessage,
    });

    res.status(200).json({
      success: true,
      data: newMessage,
      delivered: messageSent,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getMessages(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const { otherUserId } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getConversations(req: CustomRequest, res: Response): Promise<void> {
  const userId = req.user._id;

  try {
    const conversations = await User.aggregate([
      {
        $match: { _id: { $ne: userId } } // exclude current user
      },
      {
        $lookup: {
          from: 'messages',
          let: { otherUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$senderId', userId] },
                        { $eq: ['$receiverId', '$$otherUserId'] }
                      ]
                    },
                    {
                      $and: [
                        { $eq: ['$senderId', '$$otherUserId'] },
                        { $eq: ['$receiverId', userId] }
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { otherUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$senderId', '$$otherUserId'] },
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$read', false] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'unreadMessages'
        }
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
          unreadCount: {
            $cond: [
              { $gt: [{ $size: '$unreadMessages' }, 0] },
              { $arrayElemAt: ['$unreadMessages.count', 0] },
              0
            ]
          }
        }
      },
      {
        $project: {
          firstName:1,
          username: 1,
          avatar: 1,
          isOnline: 1,
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: {
          'lastMessage.createdAt': -1 // messages first, latest on top
        }
      }
    ]);

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching user-based conversations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

