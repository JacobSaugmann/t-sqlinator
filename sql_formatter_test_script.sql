
-- Opret testtabeller
CREATE TABLE Person (
    PersonID INT PRIMARY KEY,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    BirthDate DATE,
    City NVARCHAR(50)
);

CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    PersonID INT,
    OrderDate DATE,
    Amount DECIMAL(10, 2),
    Status NVARCHAR(20)
);

CREATE TABLE Products (
    ProductID INT PRIMARY KEY,
    ProductName NVARCHAR(100),
    Price DECIMAL(10, 2)
);

CREATE TABLE OrderLines (
    OrderLineID INT PRIMARY KEY,
    OrderID INT,
    ProductID INT,
    Quantity INT
);

CREATE TABLE Sales (
    SalesID INT PRIMARY KEY,
    SalesPerson NVARCHAR(50),
    Region NVARCHAR(50),
    Amount DECIMAL(10, 2)
);

-- INSERT
INSERT INTO Person (PersonID, FirstName, LastName, BirthDate, City)
VALUES (1, 'Jacob', 'Saugmann', '1985-06-15', 'Copenhagen');

INSERT INTO Orders (OrderID, PersonID, OrderDate, Amount, Status)
VALUES (1001, 1, '2025-10-01', 250.00, 'Pending');

INSERT INTO Products (ProductID, ProductName, Price)
VALUES (101, 'SQL Formatter Pro', 99.99);

INSERT INTO OrderLines (OrderLineID, OrderID, ProductID, Quantity)
VALUES (1, 1001, 101, 2);

INSERT INTO Sales (SalesID, SalesPerson, Region, Amount)
VALUES 
    (1, 'Jacob', 'East', 100),
    (2, 'Jacob', 'West', 150),
    (3, 'Lars', 'East', 200),
    (4, 'Lars', 'West', 250),
    (5, 'Kim', 'East', 300),
    (6, 'Kim', 'West', 350);

-- UPDATE
UPDATE Orders
SET Status = 'Completed'
WHERE OrderID = 1001;

-- DELETE
DELETE FROM Orders
WHERE OrderID = 9999;

-- SELECT med flere INNER JOINs og WHERE
SELECT 
    P.FirstName AS Fornavn,
    P.LastName AS Efternavn,
    O.OrderDate AS Ordredato,
    OL.Quantity AS Antal,
    PR.ProductName AS Produkt,
    PR.Price AS Pris,
    O.Amount AS TotalBeløb
FROM Person AS P
INNER JOIN Orders AS O ON P.PersonID = O.PersonID
INNER JOIN OrderLines AS OL ON O.OrderID = OL.OrderID
INNER JOIN Products AS PR ON OL.ProductID = PR.ProductID
WHERE O.Status = 'Completed'
AND PR.Price > 50;

-- GROUP BY og HAVING
SELECT 
    P.City AS By,
    COUNT(O.OrderID) AS AntalOrdre,
    SUM(O.Amount) AS TotalOmsætning
FROM Person AS P
INNER JOIN Orders AS O ON P.PersonID = O.PersonID
GROUP BY P.City
HAVING SUM(O.Amount) > 100;

-- CTE
WITH StoreOrdre AS (
    SELECT OrderID, PersonID, Amount
    FROM Orders
    WHERE Amount > 200
)
SELECT P.FirstName, P.LastName, S.Amount
FROM StoreOrdre AS S
INNER JOIN Person AS P ON P.PersonID = S.PersonID;

-- SUBQUERY
SELECT FirstName, LastName
FROM Person
WHERE PersonID IN (
    SELECT PersonID
    FROM Orders
    WHERE Status = 'Completed'
);

-- CASE
SELECT 
    OrderID,
    Amount,
    CASE 
        WHEN Amount >= 200 THEN 'Stor ordre'
        WHEN Amount >= 100 THEN 'Mellem ordre'
        ELSE 'Lille ordre'
    END AS Ordretype
FROM Orders;

-- CURSOR
DECLARE @OrderID INT;
DECLARE ordre_cursor CURSOR FOR
SELECT OrderID FROM Orders;

OPEN ordre_cursor;
FETCH NEXT FROM ordre_cursor INTO @OrderID;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Behandler ordre: ' + CAST(@OrderID AS NVARCHAR);
    FETCH NEXT FROM ordre_cursor INTO @OrderID;
END;

CLOSE ordre_cursor;
DEALLOCATE ordre_cursor;

-- WINDOW FUNCTION
SELECT 
    OrderID,
    PersonID,
    Amount,
    AVG(Amount) OVER (PARTITION BY PersonID) AS GennemsnitBeløb
FROM Orders;

-- EXISTS
SELECT FirstName, LastName
FROM Person AS P
WHERE EXISTS (
    SELECT 1
    FROM Orders AS O
    WHERE O.PersonID = P.PersonID AND O.Status = 'Completed'
);

-- UNION
SELECT FirstName FROM Person
UNION
SELECT Status FROM Orders;

-- TRANSACTION med TRY...CATCH
BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE Orders
    SET Amount = Amount + 10
    WHERE Status = 'Pending';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT ERROR_MESSAGE();
END CATCH;

-- MERGE
MERGE INTO Orders AS Target
USING (
    SELECT 1 AS PersonID, '2025-10-08' AS OrderDate, 300.00 AS Amount, 'Pending' AS Status
) AS Source
ON Target.PersonID = Source.PersonID AND Target.OrderDate = Source.OrderDate
WHEN MATCHED THEN
    UPDATE SET Amount = Source.Amount
WHEN NOT MATCHED THEN
    INSERT (PersonID, OrderDate, Amount, Status)
    VALUES (Source.PersonID, Source.OrderDate, Source.Amount, Source.Status);

-- PIVOT
SELECT SalesPerson, [East] AS EastSales, [West] AS WestSales
FROM (
    SELECT SalesPerson, Region, Amount
    FROM Sales
) AS SourceTable
PIVOT (
    SUM(Amount)
    FOR Region IN ([East], [West])
) AS PivotTable;
