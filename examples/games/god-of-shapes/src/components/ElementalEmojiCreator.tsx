"use client";

import { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "framer-motion";
import { X,  Undo, Info, Sparkles, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth-service";
import { useAuth } from "@/components/AuthProvider";
// Define the types of elements
const ELEMENT_TYPES = {
  EMOJI: "emoji",
};

// Define the emoji categories and their elements
const emojiCategories = [
  {
    name: "Basic Elements",
    emojis: [
      { emoji: "🔥", name: "Fire" },
      { emoji: "💧", name: "Water" },
      { emoji: "🌍", name: "Earth" },
      { emoji: "💨", name: "Air" },
      { emoji: "❄️", name: "Ice" },
      { emoji: "⚡", name: "Electricity" },
      { emoji: "🧪", name: "Chemical" },
    ],
  },
  {
    name: "Nature",
    emojis: [
      { emoji: "🌱", name: "Plant" },
      { emoji: "🪨", name: "Stone" },
      { emoji: "🪵", name: "Wood" },
      { emoji: "🌳", name: "Tree" },
      { emoji: "🌿", name: "Herb" },
      { emoji: "🌾", name: "Wheat" },
      { emoji: "🌵", name: "Cactus" },
      { emoji: "🍄", name: "Mushroom" },
      { emoji: "🌸", name: "Flower" },
      { emoji: "🌼", name: "Blossom" },
      { emoji: "🌞", name: "Sun" },
      { emoji: "🌚", name: "New Moon" },
      { emoji: "🌙", name: "Crescent Moon" },
      { emoji: "⭐", name: "Star" },
      { emoji: "☁️", name: "Cloud" },
      { emoji: "🌧️", name: "Rain" },
      { emoji: "🌨️", name: "Snow" },
      { emoji: "🌩️", name: "Storm" },
      { emoji: "🌪️", name: "Tornado" },
      { emoji: "🌫️", name: "Fog" },
    ],
  },
  {
    name: "Objects",
    emojis: [
      { emoji: "🧊", name: "Ice Cube" },
      { emoji: "💎", name: "Diamond" },
      { emoji: "🔋", name: "Battery" },
      { emoji: "💡", name: "Light Bulb" },
      { emoji: "🔍", name: "Magnifier" },
      { emoji: "🧲", name: "Magnet" },
      { emoji: "⚓", name: "Anchor" },
      { emoji: "⚙️", name: "Gear" },
      { emoji: "🔧", name: "Wrench" },
      { emoji: "🔨", name: "Hammer" },
      { emoji: "🧰", name: "Toolbox" },
      { emoji: "📱", name: "Phone" },
      { emoji: "💻", name: "Computer" },
      { emoji: "🔌", name: "Plug" },
      { emoji: "📡", name: "Satellite" },
      { emoji: "🧬", name: "DNA" },
      { emoji: "🧪", name: "Test Tube" },
      { emoji: "🧫", name: "Petri Dish" },
      { emoji: "🧴", name: "Lotion" },
      { emoji: "🧷", name: "Safety Pin" },
    ],
  },
  {
    name: "Discovered",
    emojis: [],
  },
];

// Define the interface for an element
interface Element {
  id: string;
  type: string;
  content: string; // emoji character
  name: string; // element name
  left: number;
  top: number;
  isNew?: boolean;
}

// Define the interface for a connection
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

// Define interface for the API response
interface MixResponse {
  result: string;
  description: string;
}

// Emoji element component
// Emoji element component
const EmojiElement = ({
  element,
  index,
  isNew = false,
}: {
  element: { emoji: string; name: string };
  index: number;
  isNew?: boolean;
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ELEMENT_TYPES.EMOJI,
    item: {
      type: ELEMENT_TYPES.EMOJI,
      content: element.emoji,
      name: element.name,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Create a ref callback that TypeScript understands
  const ref = useRef<HTMLDivElement>(null);
  
  // Use a useEffect to connect the drag ref
  useEffect(() => {
    dragRef(ref.current);
  }, [dragRef]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={cn(
              "text-3xl cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-md transition-colors relative",
              isDragging && "opacity-50",
              isNew && "animate-pulse"
            )}
          >
            {element.emoji}
            {isNew && (
              <span className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{element.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


const CanvasElement = ({
  element,
  isSelected,
  onClick,
  onDelete,
  onDrop,
}: {
  element: Element;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDrop: (droppedElement: Element) => void;
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ELEMENT_TYPES.EMOJI,
    item: {
      id: element.id,
      left: element.left,
      top: element.top,
      content: element.content,
      name: element.name,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ELEMENT_TYPES.EMOJI,
    drop: (item: any) => {
      if (item.id !== element.id) {
        onDrop({
          id: item.id || `element-${Date.now()}`,
          type: ELEMENT_TYPES.EMOJI,
          content: item.content,
          name: item.name || "Unknown",
          left: element.left,
          top: element.top,
        });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Create a ref for the element
  const ref = useRef<HTMLDivElement>(null);

  // Connect the drag and drop refs
  useEffect(() => {
    if (!ref.current) return;
    
    const currentRef = ref.current;
    
    // Apply the drag and drop refs
    dragRef(currentRef);
    dropRef(currentRef);
    
    return () => {
      // Clean up refs
      dragRef(null);
      dropRef(null);
    };
  }, [dragRef, dropRef]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            ref={ref}
            className={cn(
              "absolute cursor-grab active:cursor-grabbing text-4xl flex items-center justify-center",
              isSelected && "ring-2 ring-primary ring-offset-2",
              isOver && "scale-110 ring-2 ring-yellow-500 ring-offset-2",
              element.isNew && "animate-bounce"
            )}
            style={{
              left: element.left,
              top: element.top,
              opacity: isDragging ? 0.5 : 1,
              zIndex: isSelected || isOver ? 10 : 1,
            }}
            animate={{
              scale: isSelected ? 1.1 : isOver ? 1.2 : 1,
              rotate: element.isNew ? [0, -10, 10, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
          >
            {element.content}
            {isSelected && (
              <button
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {element.isNew && (
              <span className="absolute -top-2 -left-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </span>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{element.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Reaction notification component
const ReactionNotification = ({
  reaction,
  onClose,
}: {
  reaction: { result: string; description: string } | null;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (reaction) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reaction, onClose]);

  return (
    <AnimatePresence>
      {reaction && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card shadow-lg rounded-lg p-4 z-50 border border-primary"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">{reaction.result}</div>
            <div>
              <h3 className="font-bold">New Element Created!</h3>
              <p>{reaction.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
// Authentication error notification component
const AuthErrorNotification = ({
  visible,
  message,
  onRetry,
}: {
  visible: boolean;
  message: string;
  onRetry: () => void;
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
        >
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Authentication Error</h3>
            <p className="mb-4 text-muted-foreground">{message}</p>
            <div className="flex justify-end">
              <Button onClick={onRetry}>Retry</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
// Loading indicator component
// Loading indicator component
const LoadingIndicator = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

// Canvas component
const Canvas = ({
  onElementDiscovered,
}: {
  onElementDiscovered: (element: { emoji: string; name: string }) => void;
}) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<boolean>(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Array<{ elements: Element[]; connections: Connection[] }>
  >([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentReaction, setCurrentReaction] = useState<{
    result: string;
    description: string;
  } | null>(null);
  const [discoveredElements, setDiscoveredElements] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Save current state to history
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], connections: [...connections] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(prevState.elements);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Initialize history
  useEffect(() => {
    if (
      elements.length === 0 &&
      connections.length === 0 &&
      history.length === 0
    ) {
      saveToHistory();
    }
  }, [elements.length, connections.length, history.length, saveToHistory]);

  // Process element combination using backend API
  // Process element combination using backend API
  const [authError, setAuthError] = useState<string | null>(null);
  const processCombination = async (element1: Element, element2: any) => {
    setIsLoading(true);
    try {
      // Get the authentication token
      const token = await authService.ensureToken();

      const response = await fetch("/api/mix-elements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          element1: element1.name,
          element2: element2.name || "Unknown",
        }),
      });

      if (response.status === 401) {
        // Handle authentication error
        setAuthError("Your session has expired. Please try again.");
        return null;
      }

      if (!response.ok) {
        console.error("API Error:", response.statusText);
        return null;
      }

      const data: MixResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling API:", error);
      setAuthError("Failed to communicate with the server. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  // Retry authentication and clear error
  const handleAuthRetry = async () => {
    setAuthError(null);
    try {
      await authService.requestNewToken();
    } catch (error) {
      setAuthError("Authentication failed. Please reload the page.");
    }
  };
  // Handle element drop on another element
  const handleElementDrop = async (
    targetElement: Element,
    droppedElement: any
  ) => {
    // Process the combination using API
    const reaction = await processCombination(targetElement, droppedElement);

    if (reaction) {
      // Extract the name from the description (after the "=")
      const namePart = reaction.description.split(" = ")[1] || "Unknown";

      // Create a new element at the target position
      const newElement: Element = {
        id: `element-${Date.now()}`,
        type: ELEMENT_TYPES.EMOJI,
        content: reaction.result,
        name: namePart,
        left: targetElement.left + 50,
        top: targetElement.top + 50,
        isNew: true,
      };

      // Add the new element to the canvas
      setElements((prevElements) => [...prevElements, newElement]);

      // Show reaction notification
      setCurrentReaction(reaction);

      // Check if this is a newly discovered element
      if (!discoveredElements.has(reaction.result)) {
        const newDiscovered = new Set(discoveredElements);
        newDiscovered.add(reaction.result);
        setDiscoveredElements(newDiscovered);

        onElementDiscovered({
          emoji: reaction.result,
          name: namePart,
        });
      }

      // Save to history
      saveToHistory();

      // Remove the "isNew" flag after animation
      setTimeout(() => {
        setElements((prevElements) =>
          prevElements.map((el) => {
            if (el.id === newElement.id) {
              return { ...el, isNew: false };
            }
            return el;
          })
        );
      }, 2000);

      return true;
    }

    return false;
  };

  const [, drop] = useDrop(() => ({
    accept: ELEMENT_TYPES.EMOJI,
    drop: (item: any, monitor) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      if (item.id) {
        // Moving existing element
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;

        setElements((prevElements) =>
          prevElements.map((el) => {
            if (el.id === item.id) {
              return {
                ...el,
                left: Math.max(
                  0,
                  Math.min(canvasRect.width - 50, el.left + delta.x)
                ),
                top: Math.max(
                  0,
                  Math.min(canvasRect.height - 50, el.top + delta.y)
                ),
              };
            }
            return el;
          })
        );
        saveToHistory();
      } else {
        // Adding new element
        const newElement: Element = {
          id: `element-${Date.now()}`,
          type: item.type,
          content: item.content,
          name: item.name || "Unknown",
          left: clientOffset.x - canvasRect.left - 25,
          top: clientOffset.y - canvasRect.top - 25,
        };
        setElements((prevElements) => [...prevElements, newElement]);
        saveToHistory();
      }
    },
  }));

  // Handle element click
  const handleElementClick = (id: string) => {
    if (connectMode) {
      if (connectSource === null) {
        setConnectSource(id);
      } else if (connectSource !== id) {
        // Create a new connection
        const newConnection: Connection = {
          id: `connection-${Date.now()}`,
          sourceId: connectSource,
          targetId: id,
        };
        setConnections((prev) => [...prev, newConnection]);
        setConnectSource(null);
        saveToHistory();
      }
    } else {
      setSelectedElement(id === selectedElement ? null : id);
    }
  };

  // Handle element delete
  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setConnections((prev) =>
      prev.filter((conn) => conn.sourceId !== id && conn.targetId !== id)
    );
    setSelectedElement(null);
    saveToHistory();
  };

  // Toggle connect mode
  const toggleConnectMode = () => {
    setConnectMode(!connectMode);
    setConnectSource(null);
    setSelectedElement(null);
  };

  // Export canvas as JSON
  const exportCanvas = () => {
    const data = {
      elements,
      connections,
      discoveredElements: Array.from(discoveredElements),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "elemental-emoji-creation.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render connections
  const renderConnections = () => {
    return connections.map((connection) => {
      const source = elements.find((el) => el.id === connection.sourceId);
      const target = elements.find((el) => el.id === connection.targetId);

      if (!source || !target) return null;

      const sourceX = source.left + 25;
      const sourceY = source.top + 25;
      const targetX = target.left + 25;
      const targetY = target.top + 25;

      // Calculate the path
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Create a dotted line
      return (
        <svg
          key={connection.id}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <line
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="text-primary"
          />
          <polygon
            points={`0,-5 10,0 0,5`}
            className="fill-primary"
            transform={`translate(${targetX}, ${targetY}) rotate(${
              angle * (180 / Math.PI)
            })`}
          />
        </svg>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex gap-2">
          {/* <Button
            variant={connectMode ? "default" : "outline"}
            size="sm"
            onClick={toggleConnectMode}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {connectMode ? "Cancel Connection" : "Connect Elements"}
          </Button> */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
        </div>
        {/* <Button variant="outline" size="sm" onClick={exportCanvas}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button> */}
      </div>
      <div
        ref={(node) => {
          drop(node);
          if (node) canvasRef.current = node;
        }}
        className="relative flex-grow bg-background border-2 border-dashed border-muted-foreground/20 rounded-md overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        {renderConnections()}
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElement}
            onClick={() => handleElementClick(element.id)}
            onDelete={() => handleDeleteElement(element.id)}
            onDrop={(droppedElement) =>
              handleElementDrop(element, droppedElement)
            }
          />
        ))}
        {connectMode && connectSource && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-background/80 z-50 pointer-events-none">
            <div className="text-center p-4 bg-card rounded-lg shadow-lg">
              <p className="text-lg font-medium">
                Select another element to connect
              </p>
            </div>
          </div>
        )}
      </div>
      {isLoading && <LoadingIndicator message="Mixing elements..." />}
      {authError && (
        <AuthErrorNotification
          visible={!!authError}
          message={authError}
          onRetry={handleAuthRetry}
        />
      )}
      <ReactionNotification
        reaction={currentReaction}
        onClose={() => setCurrentReaction(null)}
      />
    </div>
  );
};

// Main component
export default function ElementalEmojiCreator() {
  const {  isLoading, error } = useAuth();
  const [discoveredEmojis, setDiscoveredEmojis] = useState<
    Array<{ emoji: string; name: string }>
  >([]);

  const handleElementDiscovered = (element: {
    emoji: string;
    name: string;
  }) => {
    if (!discoveredEmojis.some((item) => item.emoji === element.emoji)) {
      setDiscoveredEmojis([...discoveredEmojis, element]);
    }
  };

  // Update the Discovered category
  const categories = emojiCategories.map((category) => {
    if (category.name === "Discovered") {
      return { ...category, emojis: discoveredEmojis };
    }
    return category;
  });
  // Display loading indicator while authenticating
  if (isLoading) {
    return <LoadingIndicator message="Initializing..." />;
  }

  // Display error message if authentication failed
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-2">Authentication Error</h3>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <div className="flex justify-end">
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex flex-col space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {/* <img
                src="/image-removebg-preview (2).png"
                alt="God of Shapes"
                className="h-12 w-12 object-contain"
                style={{ minWidth: "3rem", minHeight: "3rem" }}
              /> */}
              <Image
                src="/image-removebg-preview (2).png"
                alt="God of Shapes"
                width={48}
                height={48}
                className="object-contain"
                style={{ minWidth: "3rem", minHeight: "3rem" }}
              />
              <h1 className="text-4xl font-bold tracking-tight">
                God of Shapes
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combine elements to discover new ones! Drag one element onto
              another to see what happens.
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Info className="h-4 w-4 mr-1" />
                    How to Play
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-4">
                  <h3 className="font-bold mb-2">How to Play:</h3>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Drag basic elements from the sidebar onto the canvas
                    </li>
                    <li>Drag one element onto another to combine them</li>
                    <li>Discover new elements through combinations</li>
                    <li>
                      Connect elements with dotted lines to show relationships
                    </li>
                    <li>Build complex systems with your discovered elements</li>
                    <li>Hover over elements to see their names</li>
                  </ol>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <a
              href="https://github.com/Eshan276"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center p-2 rounded hover:bg-accent transition-colors"
              title="View on GitHub"
            >
              <Github className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
              <Tabs defaultValue="Basic Elements">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Elements</h2>
                  <p className="text-sm text-muted-foreground">
                    Drag elements onto the canvas or combine them
                  </p>
                </div>
                <TabsList className="w-full justify-start px-4 pt-2 flex-wrap h-auto">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.name}
                      value={category.name}
                      className="mb-1"
                    >
                      {category.name}
                      {category.name === "Discovered" &&
                        discoveredEmojis.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                            {discoveredEmojis.length}
                          </span>
                        )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
                  {categories.map((category) => (
                    <TabsContent
                      key={category.name}
                      value={category.name}
                      className="m-0 p-0"
                    >
                      {category.emojis.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {category.emojis.map((element, index) => (
                            <EmojiElement
                              key={`${category.name}-${index}`}
                              element={element}
                              index={index}
                              isNew={
                                category.name === "Discovered" &&
                                index === discoveredEmojis.length - 1
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No elements discovered yet.</p>
                          <p className="text-sm mt-2">
                            Try combining basic elements!
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>

            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
              <Canvas onElementDiscovered={handleElementDiscovered} />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
