
-- Declare a cursor for a Table or a View 'TableOrViewName' in schema 'dbo'
DECLARE @ColumnName1 NVARCHAR(50), @Id INT = 1

DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1

WHILE @@FETCH_STATUS = 0
BEGIN
    -- add instructions to be executed for every row
    INSERT INTO #OrgName (Id, Name, ParentName, Code, HierLevel)
    SELECT @Id,o.Name, O.ParentName, O.OrganizationCode, O.HierLevel
    FROM #Organization AS o
        CROSS APPLY #Organization AS oo
    WHERE oo.HierPath LIKE o.HierPath + '%'
    AND oo.Name = @ColumnName1
    EXCEPT
    SELECT Id, Name, ParentName, Code, HierLevel
    FROM #OrgName

    SET @Id += 1
    FETCH NEXT FROM db_cursor INTO @ColumnName1
END

CLOSE db_cursor
DEALLOCATE db_cursor