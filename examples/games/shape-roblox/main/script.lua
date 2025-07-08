-- SERVICES
local ChatService = game:GetService("Chat")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

-- VARIABLES
local aiNPC = workspace:WaitForChild("SHAPESBOT")
-- local apiEndpoint = "https://c707-2401-4900-6333-4686-141d-c55b-6e7b-af8d.ngrok-free.app/processshape"
--Make sure to update with your own endpoint either host it on ngrok for local testing or render--

local history = {}

-- MOVEMENT CONFIGURATION
local movementConfig = {
	wanderRadius = 20,           -- How far the NPC can wander from its spawn point
	walkSpeed = 8,               -- How fast the NPC walks
	idleTime = {min = 3, max = 8}, -- Random time range for standing still
	walkTime = {min = 3, max = 6}, -- Random time range for walking
	turnSpeed = 2                -- How quickly the NPC rotates to face new directions
}

-- SIMPLE PROMISE IMPLEMENTATION
-- We'll implement a basic promise system directly instead of requiring an external module
local Promise = {}
Promise.__index = Promise

function Promise.new()
	local self = setmetatable({
		_state = "pending",
		_value = nil,
		_reason = nil,
		_thenCallbacks = {},
		_catchCallbacks = {}
	}, Promise)
	return self
end

function Promise:resolve(value)
	if self._state == "pending" then
		self._state = "fulfilled"
		self._value = value
		for _, callback in ipairs(self._thenCallbacks) do
			callback(value)
		end
	end
	return self
end

function Promise:reject(reason)
	if self._state == "pending" then
		self._state = "rejected"
		self._reason = reason
		for _, callback in ipairs(self._catchCallbacks) do
			callback(reason)
		end
	end
	return self
end

function Promise:andThen(callback)
	if self._state == "fulfilled" then
		callback(self._value)
	else
		table.insert(self._thenCallbacks, callback)
	end
	return self
end

function Promise:catch(callback)
	if self._state == "rejected" then
		callback(self._reason)
	else
		table.insert(self._catchCallbacks, callback)
	end
	return self
end

function Promise.try(fn)
	local promise = Promise.new()
	local success, result = pcall(fn)
	if success then
		promise:resolve(result)
	else
		promise:reject(result)
	end
	return promise
end

function Promise.retryWithDelay(fn, retries, delay)
	local promise = Promise.new()

	local function attempt(retriesLeft)
		fn():andThen(function(result)
			promise:resolve(result)
		end):catch(function(err)
			if retriesLeft > 0 then
				wait(delay)
				attempt(retriesLeft - 1)
			else
				promise:reject(err)
			end
		end)
	end

	attempt(retries)
	return promise
end

-- INITIALIZE NPC
local spawnPosition = aiNPC:GetPrimaryPartCFrame().Position
local humanoid = aiNPC:FindFirstChildOfClass("Humanoid")
if not humanoid then
	humanoid = Instance.new("Humanoid")
	humanoid.Parent = aiNPC
end
humanoid.WalkSpeed = movementConfig.walkSpeed

-- MOVEMENT FUNCTIONS
local function getRandomPosition()
	local angle = math.random() * math.pi * 2
	local radius = math.random() * movementConfig.wanderRadius
	local offset = Vector3.new(math.cos(angle) * radius, 0, math.sin(angle) * radius)
	return spawnPosition + offset
end

local function moveToPosition(position)
	if humanoid then
		humanoid:MoveTo(position)
	end
end

local function startWandering()
	while true do
		-- Idle for a bit
		local idleTime = math.random(movementConfig.idleTime.min, movementConfig.idleTime.max)
		wait(idleTime)

		-- Move to a new position
		local targetPosition = getRandomPosition()
		moveToPosition(targetPosition)

		-- Wait while walking
		local walkTime = math.random(movementConfig.walkTime.min, movementConfig.walkTime.max)
		wait(walkTime)
	end
end

-- API REQUEST FUNCTION WITH RETRY
local function apiRequest(prompt)
	local requestBody = {
		prompt = prompt,
		history = history
	}
	return Promise.retryWithDelay(function()
		return Promise.try(function()
			local response = HttpService:RequestAsync({
				Url = apiEndpoint,
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json"
				},
				Body = HttpService:JSONEncode(requestBody)
			})
			if response.Success then
				local responseData = HttpService:JSONDecode(response.Body)
				return responseData.reply
			else
				error(response.StatusCode .. " - " .. response.StatusMessage)
			end
		end)
	end, 3, 2) -- Retry 3 times with 2 second delay
end

-- CHAT FUNCTION
local function npcChat(message)
	local head = aiNPC:FindFirstChild("Head")
	if head then
		ChatService:Chat(head, message, Enum.ChatColor.Blue)
	end
end

-- START WANDERING IN A SEPARATE THREAD
spawn(startWandering)

-- FACING FUNCTION - MAKE NPC FACE TOWARDS PLAYERS WHEN THEY'RE NEARBY
local function updateFacing()
	RunService.Heartbeat:Connect(function()
		local nearestPlayer = nil
		local nearestDistance = 20 -- Only react to players within this distance

		for _, player in pairs(Players:GetPlayers()) do
			local character = player.Character
			if character and character:FindFirstChild("HumanoidRootPart") then
				local distance = (character.HumanoidRootPart.Position - aiNPC.PrimaryPart.Position).Magnitude
				if distance < nearestDistance then
					nearestPlayer = character
					nearestDistance = distance
				end
			end
		end

		if nearestPlayer then
			local npcPosition = aiNPC.PrimaryPart.Position
			local playerPosition = nearestPlayer.HumanoidRootPart.Position
			local lookVector = (Vector3.new(playerPosition.X, npcPosition.Y, playerPosition.Z) - npcPosition).Unit

			local targetCFrame = CFrame.lookAt(npcPosition, npcPosition + lookVector)

			local currentCFrame = aiNPC.PrimaryPart.CFrame
			local newCFrame = currentCFrame:Lerp(
				CFrame.new(currentCFrame.Position) * targetCFrame.Rotation, 
				0.1 * movementConfig.turnSpeed
			)

			aiNPC.PrimaryPart.CFrame = newCFrame
		end
	end)
end

-- START FACING UPDATE
spawn(updateFacing)

-- EVENTS
Players.PlayerAdded:Connect(function(player)
	player.Chatted:Connect(function(message)
		table.insert(history, { role = "user", content = message })
		apiRequest(message)
			:andThen(function(reply)
				table.insert(history, { role = "assistant", content = reply })
				npcChat(reply)
			end)
			:catch(function(err)
				warn("API call failed after retries:", err)
				npcChat("Sorry, I can't think straight right now. Try again later.")
			end)
	end)
end)
